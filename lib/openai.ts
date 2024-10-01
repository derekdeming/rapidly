import openaiClient from "openai"

const openai = new openaiClient({ apiKey: process.env.OPENAI_API_KEY })

export const createEmbeddings = async (text: string) => {
  // replace newlines with spaces
  let input = text.replace(/\n/g, " ")
  // replace multiple spaces with single space
  input = input.replace(/\s+/g, " ")

  const res = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: input,
  })

  return res.data[0].embedding
}
// async function a() {
//   console.log("embeddings", (await createEmbeddings("Where are iphones made?")))
// }
// a()
//
