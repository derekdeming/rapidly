import asyncio

from Database import Database
from Reranker import Reranker
from SubqueryEngine import SubQueryEngine
from Query import Query
from DataEmitter import DataEmitter
from QAEngine import QAEngine
from ConversationEngine import ConversationEngine
from Message import AIMessage, UserMessage
from SubQueryData import SubQueryData


async def main():
    # from LiteLLM import LiteLLM

    # response = LiteLLM.acompletion(model="openai:gpt-4",
    #                               messages=[{"role": "user", "content": "Hey, how's it going?"}])
    # print(response)

    # embed = LiteLLM.aembedding(model="openai:embeddings", input=["test embedding?"])
    # print(embed)

    ########################################

    db = Database("data_v1")
    reranker = Reranker(top_n=5)
    subquery_engine = SubQueryEngine(limit=3)
    data_emitter = DataEmitter()
    data_emitter.on(lambda x: print(x))
    conversation_engine = ConversationEngine(
        db=db, reranker=reranker, subquery_engine=subquery_engine)

    q = "it infrastructure changes and feedback"
    user_message = UserMessage(message=q)

    history = [
        user_message,
        AIMessage(message="""
Recent changes in IT infrastructure, as outlined in the Q1 2024 IT Infrastructure Upgrade Plan, are geared towards enhancing efficiency, bolstering security defenses, and improving data processing capabilities. The following summarizes the plan and feedback collection process:

### Network Security System Upgrades
- **Software Upgrades**: Latest cybersecurity software to counter new threats.
- **Firewall Installation**: Implementation of advanced firewalls.
- **Employee Training**: Cybersecurity training sessions for staff.

### Cloud Storage Solutions
- **Storage Capacity Enhancement**: Increased storage for growing data volumes.
- **Security Features**: Advanced security measures for data protection.

### Advanced Data Analytics Tools
- **Software Selection**: Procuring cutting-edge AI-based analytics software.
- **System Integration**: Merging new tools with existing infrastructure.
- **Staff Training**: Equipping staff with the skills needed for new analytics tools.

### Resource Allocation
- **Budget Breakdown**: Financial planning for hardware, software, and training.
- **Cost Management**: Regular monitoring and adjustment of expenses.

### Expected Outcomes
- **Enhanced Efficiency**: Technology modernization leads to greater operational efficiency.
- **Robust Security**: Reinforced defense against cyber threats.
- **Improved Data Processing**: Better data analysis for informed decision-making.

### Feedback-Informed Priorities
- Enhancing network speed and reliability.
- Strengthening cybersecurity defenses.
- Upgrading and expanding cloud storage solutions.
- Integrating advanced data analytics tools.

### Meeting Outcomes
- Cybersecurity upgrades: Overseen by Emily Brown.
- Cloud storage expansion: Led by Alex Johnson.
- Analytics tool integration: Coordinated by John Doe.

A review meeting is planned for early December to assess progress and finalize cloud storage migration details.

### Collection, Evaluation, and Integration of Feedback
To ensure the changes meet user needs and expectations, feedback is being collected through surveys, focus groups, interviews, feedback forms, regular check-ins, and analysis of support tickets and usage metrics. This feedback is then evaluated in strategy meetings and used to refine priorities and action plans, ensuring systematic consideration within the IT upgrade strategy.

The plan reflects a comprehensive approach, incorporating recent IT infrastructure upgrades, feedback collection methodologies, and a structured evaluation process to achieve a technology landscape tailored to current and future organizational needs.                  
""",
    subqueries=[
        SubQueryData(subquery="it infrastructure changes and feedback", is_original_query=True)
    ]
    )
    ]

    res = await conversation_engine.generate_response(message=user_message, history=[], data_emitter=data_emitter)

    # top_k = await db.get_top_k(query=query, k=5)
    # reranked_results = await reranker.llm_rerank(query=query, choices=top_k)
    # print(len(reranked_results))

    # subqueries = await subquery_engine.generate_subqueries(query=query)
    # print(subqueries)

    # res = await qa_engine.answer(query=query, use_subqueries=True, data_emitter=data_emitter)

    print("answer")
    print(res)

asyncio.run(main())
