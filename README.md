# TaskPool
Put your async tasks into the pool

Give them different category, score and context

The task pool can schdule to run the task by your setting

# Rule
1. One category can only run 1 task at the same time
2. When the pool is empty, we will pick a task(with the highest score and the category is not existed) to run
3. The task belong to the same category can share a common context before tasks

# How
run `yarn test` see how it works

