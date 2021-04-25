import { Observable, Subject, of } from "rxjs";
import { catchError, delayWhen, flatMap, tap } from "rxjs/operators";

export class TaskPool {
  public readonly poolSize: number;

  private currentTaskNumber: number;

  private pendingSubjectCategoryList: {
    category: string;
    score: number;
    subjects: Subject<any>[];
    context: any;
  }[] = [];

  // this set is used to make sure in one category
  // only one subject can be executed at the same time
  private currentTaskCategory: Set<string> = new Set();

  constructor(maxTaskNumber: number) {
    this.poolSize = maxTaskNumber;
    this.currentTaskNumber = 0;
  }

  private releaseTaskNumber() {
    // if the pending list has subject
    // we don't need to decrease the currentTaskNumber
    // since we will trigger the subject right now
    if (this.pendingSubjectCategoryList.length > 0) {
      setTimeout(() => {
        try {
          this.pendingSubjectCategoryList.sort((a, b) => b.score - a.score);
          const sortedList = this.pendingSubjectCategoryList;
          const targetSubjects = sortedList.filter(
            (pendingTask) => !this.currentTaskCategory.has(pendingTask.category)
          );
          if (
            targetSubjects.length > 0 &&
            targetSubjects[0].subjects.length > 0
          ) {
            this.currentTaskCategory.add(targetSubjects[0].category);
            targetSubjects[0].subjects.shift()?.next();
            // remove empty subject category
            if (targetSubjects[0].subjects.length === 0) {
              this.pendingSubjectCategoryList = this.pendingSubjectCategoryList.filter(
                (sub) => sub.category !== targetSubjects[0].category
              );
            }
          } else {
            // we need to decrease the current number since no pending list will execute
            this.currentTaskNumber -= 1;
          }
        } catch (e) {
          this.currentTaskNumber -= 1;
        }
      }, 0);
      return;
    }
    this.currentTaskNumber -= 1;
  }

  runTask<T, R>(
    value: R,
    call: (obj: R, category: string) => Observable<T>,
    getCategoryInfo: (
      obj: R
    ) => {
      category: string;
      score: any;
      context: any;
    }
  ): Observable<T> {
    const categoryInfo = getCategoryInfo(value);
    const subject = new Subject();
    // if the pool is not full, we can trigger the call immediately
    if (
      this.currentTaskNumber < this.poolSize &&
      !this.currentTaskCategory.has(categoryInfo.category)
    ) {
      this.currentTaskNumber += 1;
      this.currentTaskCategory.add(categoryInfo.category);
      return of(value).pipe(
        flatMap((v) => call(v, categoryInfo.category)),
        catchError((e) => {
          this.currentTaskCategory.delete(categoryInfo.category);
          this.releaseTaskNumber();
          throw e;
        }),
        tap(() => {
          this.currentTaskCategory.delete(categoryInfo.category);
          this.releaseTaskNumber();
        })
      );
    }
    // if the pool is full, enlist the subject waiting for releaseTaskNumber to trigger
    const existedSubjectCategory = this.pendingSubjectCategoryList.find(
      (sub) => sub.category === categoryInfo.category
    );
    if (existedSubjectCategory) {
      existedSubjectCategory.subjects.push(subject);
    } else {
      this.pendingSubjectCategoryList.push({
        category: categoryInfo.category,
        score: categoryInfo.score,
        subjects: [subject],
        context: categoryInfo.context,
      });
    }
    return of(value).pipe(
      delayWhen(() => subject),
      flatMap((v) => call(v, categoryInfo.category)),
      catchError((e) => {
        this.currentTaskCategory.delete(categoryInfo.category);
        this.releaseTaskNumber();
        throw e;
      }),
      tap(() => {
        this.currentTaskCategory.delete(categoryInfo.category);
        this.releaseTaskNumber();
      })
    );
  }

  updatePriority(category: string, score: number) {
    const target = this.pendingSubjectCategoryList.find(
      (sub) => sub.category === category
    );
    if (target) {
      target.score = score;
    }
  }

  updateCategoryContext(category: string, context: any) {
    const target = this.pendingSubjectCategoryList.find(
      (sub) => sub.category === category
    );
    if (target) {
      target.context = context;
    }
  }

  getContextByCategory(category: string): any {
    return this.pendingSubjectCategoryList.find(
      (sub) => sub.category === category
    )?.context;
  }
}
