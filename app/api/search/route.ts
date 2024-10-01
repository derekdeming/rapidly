import { authConfig, getUserId } from '@/lib/auth';
import { createEmbeddings } from '@/lib/openai';
import prismadb from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

interface searchEntry {
  file_name: string;
  text: string;
  similarity: number;
}

/*
 * directory {string?} - directory to search in
 * files {string[]?} - files to search in
 * */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = await getUserId(session.user?.email as string)

    const body = await req.json();
    const { query, directory, files, limit } = body;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!query || typeof query !== 'string') {
      return new NextResponse('Query is required', { status: 400 });
    }

    const embeddedQuery = await createEmbeddings(query);

    const vectorQuery = `[${embeddedQuery.join(',')}]`;
    // TODO: prevent SQL injection

    const maxDocuments = 5;
    const maxChunksPerDocument = 3;

    const res: Array<searchEntry> = await prismadb.$queryRaw`
      WITH TopUniqueFileNames AS (
          SELECT 
              file_name,
              d.id as id,
              MAX(1 - (embeddings <=> ${vectorQuery}::vector)) as max_similarity
          FROM document_chunks dc
          JOIN documents d ON dc.document_id = d.id
          WHERE 1 - (embeddings <=> ${vectorQuery}::vector) > .5
          GROUP BY file_name, d.id
          ORDER BY max_similarity DESC
          LIMIT ${maxDocuments}
      ),
      RankedChunks AS (
          SELECT
              t.file_name,
              dc.text,
              1 - (dc.embeddings <=> ${vectorQuery}::vector) as similarity,
              ROW_NUMBER() OVER(PARTITION BY t.id ORDER BY 1 - (dc.embeddings <=> ${vectorQuery}::vector) DESC) as rn
          FROM TopUniqueFileNames t
          JOIN document_chunks dc ON t.id = dc.document_id
      )
      SELECT
          file_name,
          text,
          similarity
      FROM RankedChunks
      WHERE rn <= ${maxChunksPerDocument}
    `;

    let reformatted = {} as any;
    let top: { [key: string]: number } = {};

    res.forEach((row: any) => {
      if (!reformatted[row.file_name]) {
        reformatted[row.file_name] = [];
      }
      reformatted[row.file_name].push({
        text: row.text,
        similarity: row.similarity,
      });

      if (!top[row.file_name]) {
        top[row.file_name] = row.similarity;
      }
      if (row.similarity > top[row.file_name]) {
        top[row.file_name] = row.similarity;
      }
    });

    const topFiles = Object.keys(top).sort((a, b) => {
      return top[b] - top[a];
    });

    const final = topFiles.map((file) => {
      return {
        file_name: file,
        chunks: reformatted[file],
        top_similarity: top[file],
      };
    });
    // const res = await prismadb.$queryRaw`
    //   SELECT
    //     d.file_name,
    //     text,
    //     1 - (embeddings <=> ${vectorQuery}::vector) as similarity
    //   FROM document_chunks dc
    //   JOIN documents d ON dc.document_id = d.id
    //   WHERE 1 - (embeddings <=> ${vectorQuery}::vector) > .5
    //   ORDER BY similarity DESC
    //   LIMIT 10
    // `
    //
    // await prismadb.$queryRaw`
    //   SELECT
    //     dc.id,
    //     dc.document_id,
    //     dc.chunk_id,
    //     dc.text,
    //     1 - (embeddings <=> ${vectorQuery}::vector) as similarity
    //   FROM document_chunks dc
    //   WHERE
    //     1 - (embeddings <=> ${vectorQuery}::vector) > 0.5
    //   LIMIT 10;
    // `
    return new NextResponse(JSON.stringify(final), { status: 200 });
  } catch (error) {
    console.log(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
