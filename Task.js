
"use strict"
Task = function () {
 var queue = []
 var inExecution = false
 function execQueue () {
   var i = 0
   while (i < queue.length) {
     queue[i++]()
   }
   queue = []
   inExecution = false
 }
 function scheduleExec (callbacks) {
   Util.insert(queue, queue.length, callbacks)
   callbacks.length = 0
   if (!inExecution) {
     inExecution = true
     setTimeout(execQueue, 0)
   }
 }
 function tryToSchedule (settledState, callbacks) {
   if (settledState) {
     scheduleExec(callbacks)
   }
 }
 function execTask (result, callback, rejectCallback) {
   try {
     return (callback(result))                       
   }
   catch(e) {
     return rejectCallback(e)
   }
 }
 var Task = {
   new: function newFn (callback) {


     function thenExec (callback, rejectCallback) {
       _this.onResolve.push(function () {
         return execTask(_this.result, callback, rejectCallback)
       })
       _this.onReject.push(function () {
         return (rejectCallback(_this.result))
       })
       tryToSchedule(_this.settledResolve, _this.onResolve)
       tryToSchedule(_this.settledReject, _this.onReject)
     }


     var instance = Object.create(Task)


     instance.then = function then (callback, rejectCallback) {
       var thenFulfill, thenReject
       var newTask = Task.new(function (fulfill, reject) {
         thenFulfill = fulfill
         thenReject = reject
       })
       callback = callback || Util.pass
       thenExec(function (result) {
         if (result && typeof result.then === 'function') {
           result.then(callback, rejectCallback || thenReject)
           .then(thenFulfill, thenReject)
         } else {
           thenFulfill(execTask(result, callback, thenReject))
         }
       },
       rejectCallback && function (result) {
         if (result && typeof result.then === 'function') {
           result.then(rejectCallback, thenReject)
           .then(thenFulfill, thenReject)
         } else {
           thenFulfill(execTask(result, rejectCallback, thenReject))
         }
       }
       || thenReject)
       return newTask
     }
     instance.isPending = function isPending () {
       return !_this.settledResolve && !_this.settledReject
     }
     instance.isResolved = function isResolved () {
       return _this.settledResolve
     }
     instance.isRejected = function isRejected () {
       return _this.settledReject
     }
     var _this = {}
     _this.onResolve = []
     _this.onReject = []
     _this.result = undefined
     _this.settledResolve = false
     _this.settledReject = false
     _this.fulfill = function fulfill(result) {
       if (!_this.settledResolve && !_this.settledReject) {
         _this.result = result
         _this.settledResolve = true
         scheduleExec(_this.onResolve)
       }
       return result
     }
     _this.reject = function reject(result) {
       if (!_this.settledResolve && !_this.settledReject) {
         _this.result = result
         _this.settledReject = true
         scheduleExec(_this.onReject)
       }
       return result
     }
     callback = callback || Util.noAction
     callback(_this.fulfill, _this.reject)
     return instance
   },
   resolve: function resolve (obj) {
     if (Util.prototypeof(obj, Task)) {
       return obj
     }
     var resolveFulfill, resolveRecject
     var newTask = Task.new(function (fulfill, reject) {
       resolveFulfill = fulfill
       resolveRecject = reject
     })
     if (typeof obj === 'object' && typeof obj.then === 'function') {
       obj.then(resolveFulfill, resolveRecject)
       return newTask
     }
     resolveFulfill(obj)
     return newTask
   },
   reject: function reject (obj) {
     if (Proto.prototypeof(obj, Task)) {
       return obj
     }
     var rejectTask
     var newTask = Task.new(function (fulfill, reject) {
       rejectTask = reject
     })
     if (typeof obj === 'object' && typeof obj.then === 'function') {
       obj.then(rejectTask, rejectTask)
       return newTask
     }
     rejectTask(obj)
     return newTask
   },
   all: function all (tasks) {
     var allFulfill, allReject
     var allTask = Task.new(function (fulfill, reject) {
       allFulfill = fulfill
       allReject = reject
     })
     var results = []
     var count = 0
     for (var i = 0, len = tasks.length; i < len; i++) {
       Task.resolve(tasks[i])
       .then(function (i) {
         return function (result) {
           count++
           results[i] = result
           if (count === len) {
             allFulfill(results)
           }
         }
       }(i), allReject)
     }
     return allTask
   },
   join: function join () {
     return Task.all(arguments)
   },
   flowList: function flowList (list) {
     var tasks = [this.then(list[0])]
     for (var i = 1; i < list.length; i++) {
       tasks.push(tasks[i - 1].then(list[i]))
     }
     return Task.all(tasks)
   },
   flow: function flow () {
     return this.flowList(arguments)
   },
   race: function race (tasks) {
     var raceFulfill, raceReject
     var newTask = this.make(function (fulfill, reject) {
       raceFulfill = fulfill
       raceReject = reject
     })
     for (var i = 0; i < tasks.length; i++) {
       Task.resolve(tasks[i])
       .then(raceFulfill, raceReject)
     }
     return newTask
   },
   method: function method (obj, methodName) {
     return function bind () {
       return Task.resolve(obj[methodName].apply(obj, arguments))
     }
   },
   until: function until (test, callback) {
     var resolve, reject
     var thisTask = this
     var settled = false
     function resolveUntil (value) {
       settled = true
       return resolve(value)
     }
     var untilTask = Task.new(function (ok, error) {
       resolve = ok
       reject = error
     })
     thisTask.then(function repeat (result) {
       Task.resolve(test(result)).then(function (ok) {
         if (ok) {
           return Task.resolve(callback(result, resolveUntil))
           .then(function (result) {
             if (!settled) {
               repeat(result)
             }
           }, reject)
         } else {
           thisTask.then(resolveUntil, reject)
         }
       }, reject)
     })
     return untilTask
   },
   range: function range (refs, callback) {
     var setup = Util.setupRange(refs)
     var i = 0
     return this
     .until(function () {
       return i < setup.length
     },
     function (result, resolve) {
       result = setup.start + i * setup.step
       return Task.resolve(callback(result, resolve))
       .then(function () {
         i++
         return result + setup.step
       })
     })
   },
   beside: function beside (callback) {
     return Task.all([this, this.then(callback)])
     .then(function (tuple) {
       return tuple[0]
     })
   },
   mix: function mix (callback, reject) {
     return this.then(function (results) {
       return callback.apply(this, results)
     }, reject)
   },
   catch: function catchFn (callback) {
     return this.then(Util.pass, callback)
   },
   finally: function finallyFn (callback) {
     var thisTask = this
     function finallyFn () {
       var finallyTask = Task.resolve(callback())
       if (finallyTask.isRejected()) {
         return finallyTask
       }
       return thisTask
     }
     return thisTask.then(finallyFn, finallyFn)
   }
 }
 return Task
}()