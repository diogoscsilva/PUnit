PUnit = function () {
 function createExpect (units, done) {
   return function expect (value) {
     var obj = Object.create(matchers)
     obj.value = value
     obj.push = function (testObj) {
       var task
       if (obj.isResolve) {
         task = obj.value
         .then(function (value) {
           testObj.value = value
           testObj.result = testObj.test()
           done()
           return testObj
         })
       } else if (obj.isRejects) {
         task = obj.value
         .then(function () {})
         .cacth(function (value)  {
           testObj.value = value
           testObj.result = testObj.test()
           done()
           return testObj
         })
       } else {
         testObj.result = testObj.test()
         task = Task.resolve(testObj.result)
         .then(function () {
           done()
           return testObj
         })
       }
       if (obj.isNot) {
         task.then(function (testObj) {testObj.result = !testObj.result})
       }
       units.push(task)
     }
     return obj
   }
 }
 const mokeAPI = {
   mockReturnValue: function (value) {
     this.result = value
   },
   mockReturnValueOnce: function (value) {
     this.moke.results.push({value: value})
   }
 }
 const createMokeFn = function () {
   var moke = {
     calls: [],
     results: []
   }
   var patterns = []
   function checkPatterns (args) {
     for (var i = 0; i < patterns.length; i++) {
       if (Util.checkPattern(patterns[i][0], args)) {
         return patterns[i][1]
       }
     }
   }
   function mokeFn () {
     var result = mokeFn.result
     if (moke.results[moke.calls.length] === undefined) {
       moke.results.push({value: result})
     } else if (patterns.length > 0) {
       var callback = checkPatterns(arguments)
       if (callback) {
         result = callback(arguments)
       }
     } else {
       result = moke.results[moke.calls.length].value
     }
     moke.calls.push(Array.prototype.slice.call(arguments))
     return result
   }
   mokeFn.result = undefined
   mokeFn.moke = moke
   mokeFn.mockReturnValue = mokeAPI.mockReturnValue
   mokeFn.mockReturnValueOnce = mokeAPI.mockReturnValueOnce
   mokeFn.where = function where (test, callback) {
     patterns.push([test, callback])
   }
   return mokeFn
 }
 var matchers = {
   toBe: function (expectedValue) {
     this.push({
       type: 'toBe',
       expected: expectedValue,
       value: this.value,
       test: function () {return this.value === expectedValue}
     })
   },
   toBeEqual: function (expectedValue) {
     this.push({
       type: 'toBeEqual',
       expected: expectedValue,
       value: this.value,
       test: function () {return Util.isEqual(this.value, expectedValue)}
     })
   },
   isNot: false,
   get not () {
     this.isNot = true
     return this
   },
   toBeNull: function () {
     this.push({
       type: 'toBeNull',
       value: this.value,
       test: function () {return this.value === null}
     })
   },
   toBeUndefined: function () {
     this.push({
       type: 'toBeUndefined',
       value: this.value,
       test: function () {return this.value === undefined}
     })
   },
   toBeTruthy: function () {
     this.push({
       type: 'toBeTruthy',
       value: this.value,
       test: function () {return this.value && true}
     })
   },
   toBeFalsy: function () {
     this.push({
       type: 'toBeFalsy',
       value: this.value,
       test: function () {return !this.value && true}
     })
   },
   toBeGreaterThan: function (expectedValue) {
     this.push({
       type: 'toBeGreaterThan',
       expected: expectedValue,
       value: this.value,
       test: function () {return Util.gt(this.value, expectedValue)}
     })
   },
   toBeGreaterThanOrEqual: function (expectedValue) {
     this.push({
       type: 'toBeGreaterThanOrEqual',
       expected: expectedValue,
       value: this.value,
       test: function () {return Util.gt(this.value, expectedValue) || this.value === expectedValue}
     })
   },
   toBeLessThan: function (expectedValue) {
     this.push({
       type: 'toBeLessThan',
       expected: expectedValue,
       value: this.value,
       test: function () {return !Util.gt(this.value, expectedValue) && this.value !== expectedValue}
     })
   },
   toBeLessThanOrEqual: function (expectedValue) {
     this.push({
       type: 'toBeLessThanOrEqual',
       expected: expectedValue,
       value: this.value,
       test: function () {return !Util.gt(this.value, expectedValue)}
     })
   },
   toMatch: function (expectedValue) {
     this.push({
       type: 'toMatch',
       expected: expectedValue,
       value: this.value,
       test: function () {return this.value.test(expectedValue)}
     })
   },
   toBeTypeOf: function (expectedValue) {
     this.push({
       type: 'toBeTypeOf',
       expected: expectedValue,
       value: this.value,
       test: function () {return Util.typeof(this.value, expectedValue)}
     })
   },
   toBeSameOf: function (expectedValue) {
     this.push({
       type: 'toBeSameOf',
       expected: expectedValue,
       value: this.value,
       test: function () {return Util.isSameOf(this.value, expectedValue)}
     })
   },
   toBeEmpty: function () {
     this.push({
       type: 'toBeEmpty',
       value: this.value,
       test: function () {
         for (var prop in this.value) {
           if (this.value.hasOwnProperty(prop)) {
             return false
           }
         }
         return true
       }
     })
   },
   toBePrototypeHide: function () {
     this.push({
       type: 'toBePrototypeHide',
       value: this.value,
       test: function () {
         return Util.isPrototypeHide(this.value)
       }
     })
   },
   toThrow: function (expectedValue) {
     try {
       this.value()
     } catch (e) {
       this.value = e
     }
     this.push({
       type: 'toThrow',
       expected: expectedValue,
       value: this.value,
       test: function () {var o = this
         if (typeof expectedValue === 'function') {
           return this.value instanceof expectedValue
         } else if (typeof expectedValue === 'string') {
           if (this.value instanceof Error) {
             return this.value.message === expectedValue
           }
           return this.value === expectedValue
         }
         return this.value instanceof Object.getPrototypeOf(expectedValue).constructor
         && this.value.message === expectedValue.message
       }
     })
   },
   isResolves: false,
   get resolves () {
     this.isResolve = true
     return this
   },
   isRejects: false,
   get rejects () {
     this.isRejects = true
     return this
   }
 }
 return {
   new: function () {
     const tests = []
     const pUnit = {}
     Object.defineProperty(pUnit, 'test', {value: function (name, callback) {
       tests.push({
         name: name,
         execut: callback
       })
     }})
     Object.defineProperty(pUnit, 'fn', {value: function () {
       return createMokeFn()
     }})
     Object.defineProperty(pUnit, 'execut', {value: function () {
       var results = []
       for (var i = 0; i < tests.length; i++) {
         var asyncTest = Task.new(function (resolve) {
           var units = [{result: tests[i].name}]
           var done = function () {
             resolve(units)
           }
           try {
             var result
             if (tests[i].execut.length === 1) {
               result = tests[i].execut(createExpect(units, done))
             } else {
               result = tests[i].execut(createExpect(units, function () {}), done)
             }
             return Task.resolve(result)
             .catch (function (e) {
               console.log(e)
               units.push({
                 type: 'error',
                 expected: 'not fail',
                 vaule: e,
                 result: false
               })
             })
           }
           catch (e) { 
             units.push({
               type: 'error',
               expected: 'not fail',
               vaule: e,
               result: false
             })
             done()
           }
         })
         .then(function (unitsTasks) {
           return Task.all(unitsTasks)
           .then(function (units) {
             return units.map(function (item) {return item.result || Object.entries(item)})
           })
         })
         results.push(asyncTest)
       }
       return Task.all(results)
       .then(function (results) {
         const objResults = {}
         const failures = results.filter(function (result) {
           return result.some(function (test, key) {
             return key !== 0 && test !== true
           })
         })
         if (failures.lentgh === 0) {
           objResults.result = results.length + ' fulfilled tests, all OK.'
         } else {
           objResults.result = results.length + ' fulfilled tests, with ' + failures.length + ' failures.'
         }
         objResults.failures = failures
         return objResults
       })
       .catch (function (e) {
         console.log(e)
       })
     }})
     return pUnit
   }
 }
}()