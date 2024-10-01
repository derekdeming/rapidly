import { NotionAPILoader } from "langchain/document_loaders/web/notionapi";
import axios from "axios";
export const pageLoader = (pageId: string) => new NotionAPILoader({
  clientOptions: {
    auth: process.env.NOTION_SECRET
  },
  id: pageId,
  type: "page"
})

export const getNotionUpdatesSince = async (timestamp = new Date()) => {
  let oldestUpdateTimestamp = new Date("1970-01-01")
  let next_query_cursor: string | null = null
  let updatedPages: any[] = []

  // TODO: implement pagination
  // while (oldestUpdateTimestamp.valueOf < timestamp.valueOf) {
  const res = await axios.post("https://api.notion.com/v1/search", {
    filter: {
      value: "page",
      property: "object"
    },
    sort: {
      direction: "descending",
      timestamp: "last_edited_time"
    }
  },
    {
      headers: {
        "Authorization": `Bearer ${process.env.NOTION_SECRET}`,
        "Notion-Version": "2022-06-28"
      }
    }
  )
  let { next_cursor, has_more, results } = res.data
  next_query_cursor = has_more ? next_cursor : null

  let r = results.map(({ id, last_edited_time }: any) => ({ id, lastEditedTime: new Date(last_edited_time) }))
  // console.log("r", r)
  console.log(res.data)
  // const { results } = res.data
  // updatedPages.concat(results)
  // console.log("results", results)
  // }
  return updatedPages
}
