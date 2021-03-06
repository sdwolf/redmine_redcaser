var Redcaser = Redcaser || {}

Redcaser.TestSuiteTree = (function () {
  'use strict'

  var TestSuite  = Redcaser.TestSuite
  var TestCase   = Redcaser.TestCase
  var TreeEvents = Redcaser.TreeEvents

  // self :: DOM
  var self = function (root) {
    this.root     = this.build(root)

    this.getTestSuiteData()

    TreeEvents.attach(this)
  }

  var def = self.prototype

  // build :: -> DOM
  def.build = function (root) {
    this.header = DOMBuilder.div({
      classes:  ['tree-header'],
      children: [
        DOMBuilder.div({
          classes:  ['tree-actions'],
          children: [
            DOMBuilder.link({
              classes:  ['suite-create', 'icon', 'icon-add'],
              href: '#',
              children: [DOMBuilder.text('Add test suite')]
            })
          ]
        })
      ]
    })

    this.body = DOMBuilder.div({classes:  ['tree-body']})

    root.appendChild(this.header)
    root.appendChild(this.body)

    return root
  }

  // formatTreeData :: Object -> []
  def.formatTreeData = function (data) {
    var nodes = []

    this.testCases  = {}
    this.testSuites = {}

    data.test_suites.forEach(function (element) {
      this.testSuites[element.id] = new TestSuite(element, data)
    }.bind(this))

    data.test_cases.forEach(function (element) {
      this.testCases[element.id] = new TestCase(element)
    }.bind(this))

    return nodes
  }

  def.getTestSuiteData = function () {
    var params = {
      done: this.createTestSuiteTree.bind(this),
      fail: function (response) { alert(response.responseJSON.errors) }
    }

    Redcaser.API.testSuites.index(params)
  }

  // createTestSuiteTree :: Object
  def.createTestSuiteTree = function (data) {
    this.treeData = this.formatTreeData(data)

    if (data.test_suites.length === 0) {
      this.noSuite = this.buildNoSuitesBlock()
      this.body.appendChild(this.noSuite)
    } else {
      this.buildTree()
      this.makeSuiteCasesSortable()
    }
  }

  def.buildTree = function () {
    var rootSuites  = []
    var childSuites = []
    var childCases  = []

    for (var key in this.testSuites) {
      if (this.testSuites.hasOwnProperty(key)) {
        if (this.testSuites[key].parent_id === null) {
          rootSuites.push(this.testSuites[key])
        }
      }
    }

    for (var key in this.testSuites) {
      if (this.testSuites.hasOwnProperty(key)) {
        if (this.testSuites[key].parent_id !== null) {
          childSuites.push(this.testSuites[key])
        }
      }
    }

    for (var key in this.testCases) {
      if (this.testCases.hasOwnProperty(key)) {
        if (this.testCases[key].parent_id !== null) {
          childCases.push(this.testCases[key])
        }
      }
    }

    rootSuites.forEach(function (element) {
      this.body.appendChild(element.node)
    }.bind(this))

    childSuites.forEach(function (element) {
      var parentNode = this.testSuites[element.parent_id].childSuitesNode

      parentNode.appendChild(element.node)
    }.bind(this))

    childCases.forEach(function (element) {
      var testSuite  = this.testSuites[element.test_suite_id]
      var parentNode = testSuite.childCasesNode

      if (parentNode.childNodes[0] == testSuite.sortDisabled) {
        parentNode.removeChild(parentNode.childNodes[0])
      }

      parentNode.appendChild(element.node)
    }.bind(this))
  }

  def.buildNoSuitesBlock = function () {
    return DOMBuilder.div({
          classes:  ['no-suites', 'empty-content'],
          children: [
            DOMBuilder.div({
              classes: ['left'],
              children: [
                DOMBuilder.span({
                  classes:  ['title'],
                  children: [DOMBuilder.text('There aren\'t any test suites, yet')]
                }),
                DOMBuilder.text('Use the "Add test suite" button to create the first test suite.')
              ]
            }),
            DOMBuilder.div({
              classes: ['right'],
              children: [
                DOMBuilder.span({
                  classes:  ['title'],
                  children: [DOMBuilder.text('Test cases and suites?')]
                }),
                DOMBuilder.text('A test case verifies a certain feature, functionality or requirement. Suites are used to organize related test cases into groups.'),
              ]
            }),
            DOMBuilder.div({classes: ['clear-both']})
          ]
    })
  }

  def.makeSuiteCasesSortable = function () {
    var cases = $('.suite-cases')

    cases.sortable({
      connectWith: '.suite-cases',
      handle:      '.case-drag',
      placeholder: 'suite-case-placeholder',
      update :     this.handleCaseMove.bind(this)
    })
  }

  def.handleCaseMove = function (event, ui) {
    var toElement = event.toElement.parentNode
    // jQuery UI fires two events when moving an element from one container
    // to another. We need to handle the event from the new container.
    var eventOnTarget = toElement.parentNode.parentNode === event.target

    if (eventOnTarget) {
      var testCaseId  = toElement.parentNode.dataset.id
      var testSuiteId = event.target.parentNode.parentNode.dataset.id

      var data = {
        test_case: {
          test_suite_id: testSuiteId
        }
      }

      var params = {
        id:   testCaseId,
        data: data,
        done: function (response) {
          var testSuite = this.testSuites[testSuiteId]

          toElement.parentNode.getElementsByClassName('case-actions-edit')[0].dataset.test_suite_id = testSuiteId

          if (testSuite.sortDisabled.parentNode) {
            testSuite.childCasesNode.removeChild(testSuite.sortDisabled)
          }
        }.bind(this),
        fail: function (response) { alert(response.responseJSON.errors) }
      }

      Redcaser.API.testCases.update(params)
    }
    else {
      var testSuiteId = event.target.parentNode.parentNode.dataset.id
      var testSuite   = this.testSuites[testSuiteId]

      if (!testSuite.childCasesNode.childNodes.length && !testSuite.sortDisabled.parentNode) {
        testSuite.childCasesNode.appendChild(testSuite.sortDisabled)
      }
    }
  }

  return self
})()
