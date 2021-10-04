import { TaskPool } from '../';
import { from, of } from 'rxjs'
import { mergeMap, delay } from "rxjs/operators";

const consolePrintTask = new TaskPool(3);

const tasks = [
  {category:'car', timeCost:2, id:0, score: 1},
  {category:'car', timeCost:2, id:1, score: 1 },
  {category:'house', timeCost:2, id:2, score: 10 },
  {category:'food', timeCost:2, id:3, score: 100 },
  {category:'food', timeCost:2, id:4, score: 100 },
  {category:'house', timeCost:2, id:5, score: 10 },
]

console.log('task start')
from(tasks).pipe(
  mergeMap(task=>consolePrintTask.runTask(
    task,
    task => of(task).pipe(
      delay(task.timeCost*1000),
    ),
    task=> ({      
      category: task.category,
      score: task.score,
      context: '',
    })
  ))
).subscribe((task)=>console.log(`id: ${task.id}, category: ${task.category}`))

