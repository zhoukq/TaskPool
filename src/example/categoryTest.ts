import { TaskPool } from '../';
import { from, of } from 'rxjs'
import { mergeMap, delay } from "rxjs/operators";

const consolePrintTask = new TaskPool(3);

const tasks = [
  {category:'car', timeCost:2, id:0 },
  {category:'car', timeCost:2, id:1 },
  {category:'house', timeCost:2, id:2 },
  {category:'food', timeCost:2, id:3 },
  {category:'food', timeCost:2, id:4 },
  {category:'house', timeCost:2, id:5 },
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
      score:1,
      context: '',
    })
  ))
).subscribe((task)=>console.log(`id: ${task.id}, category: ${task.category}`))

