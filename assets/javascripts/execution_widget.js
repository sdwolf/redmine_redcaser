var Redcaser = Redcaser || {}

Redcaser.ExecutionWidget = (function () {
  'use strict'

  var ExecutionSuiteBuilder = Redcaser.ExecutionSuiteBuilder
  var ExecutionEvents       = Redcaser.ExecutionEvents
  var ExecutionDialog       = Redcaser.ExecutionDialog
  var EnvironmentDialog     = Redcaser.EnvironmentDialog
  var TestCasePreview       = Redcaser.TestCasePreview

  // self :: DOM
  var self = function (root) {
    this.root      = this.build(root)
    this.testCases = {}
    this.listItems = {}

    this.getExecutionSuites()
    ExecutionEvents.attach(this)
  }

  var def = self.prototype

  // build :: DOM -> DOM
  def.build = function (root) {
    this.select = DOMBuilder.select({classes: ['execution-select']})
    this.suiteActions = DOMBuilder.div({classes:  ['execution-actions']})

    this.header = DOMBuilder.div({
      classes:  ['execution-header'],
      children: [
        DOMBuilder.div({
          classes:  ['contextual'],
          children: [
            DOMBuilder.link({
              classes:  ['icon', 'icon-add', 'execution-create'],
              href:     '#',
              children: [DOMBuilder.text('Add execution suite')]
            })
          ]
        }),
        this.select,
        this.suiteActions
      ]
    })

    this.body    = DOMBuilder.div({classes: ['execution-body']})
    this.preview = DOMBuilder.div({classes: ['case-preview']})

    root.appendChild(this.header)
    root.appendChild(this.body)
    root.appendChild(this.preview)

    return root
  };

  def.getExecutionSuites = function () {
    var params = {
      done: this.createExecuionSuiteSelect.bind(this),
      fail: function (response) { console.log(response) }
    }

    Redcaser.API.executionSuites.index(params)
  }

  def.createExecuionSuiteSelect = function (response) {
    this.project = response.project

    while (this.select.firstChild) {
      this.select.removeChild(this.select.firstChild)
    }

    this.select.appendChild(DOMBuilder.option())

    response.execution_suites.forEach(function (element) {
      this.select.appendChild(DOMBuilder.option({
        value:    element.id,
        children: [DOMBuilder.text(element.name)]
      }))
    }.bind(this))
  }

  def.appendSuiteOption = function (executionSuite) {
    this.select.appendChild(
      DOMBuilder.option({
        value:    executionSuite.id,
        children: [DOMBuilder.text(executionSuite.name)]
      })
    )
  }

  def.updateSuiteOption = function (executionSuite) {
    var nodes = this.select.childNodes

    for(var index = 0; index < nodes.length; index += 1) {
      var option = nodes[index]

      if(option.value == executionSuite.id) {
        option.removeChild(option.firstChild)
        option.appendChild(DOMBuilder.text(executionSuite.name))

        break
      }
    }
  }

  def.createExecutionSuiteBody = function (data) {
    this.initializeBody()
    this.initializePreview()
    this.initializeSuiteActions()

    if (data.test_cases) {
      this.testCases = data.test_cases.reduce(function (total, element) {
        total[element.id] = element

        return total
      }, {})
    }
    else {
      this.testCases = {}
    }

    this.statuses = data.execution_results
    this.selectedExecutionSuite = data.execution_suite

    if (data.execution_suite) {
      this.buildExecutionSuiteActions(data.execution_suite);
      this.body.appendChild(this.buildExecutionSuiteBody(data))
    }

  }

  def.displayCasePreview = function (id) {
    this.initializePreview()

    this.preview = TestCasePreview.build(
      this.testCases[parseInt(id)],
      this.statuses
    )
    this.root.appendChild(this.preview)
  }

  def.initializeBody = function () {
    while (this.body.firstChild) {
      this.body.removeChild(this.body.firstChild)
    }
  }

  def.initializeSuiteActions = function () {
    while (this.suiteActions.firstChild) {
      this.suiteActions.removeChild(this.suiteActions.firstChild)
    }
  }

  def.initializePreview = function () {
    while (this.preview.firstChild) {
      this.preview.removeChild(this.preview.firstChild)
    }

    if (this.preview.parentNode == this.root) this.root.removeChild(this.preview)
  }

  def.buildExecutionSuiteBody = function (data) {
    var children = [];

    children.push(
      DOMBuilder.table({
          classes: ['execution-table', 'list', 'test-cases'],
          children: [
            DOMBuilder.tr({
              classes:  ['case-list-header'],
              children: [
                DOMBuilder.th({
                  classes:  ['list-header-check'],
                  children: [DOMBuilder.checkbox()]
                }),
                DOMBuilder.th({
                  classes:  ['list-header-id'],
                  children: [DOMBuilder.text('Id')]
                }),
                DOMBuilder.th({
                  classes:  ['list-header-title'],
                  children: [DOMBuilder.text('Title')]
                }),
                DOMBuilder.th({
                  classes:  ['list-header-status'],
                  children: [DOMBuilder.text('Status')]
                })
              ]
            })
          ]
      })
    )

    var elements = data.test_cases
    var caseList = []

    elements.forEach(function (element) {
      var node = DOMBuilder.tr({
        classes:  ['list-item'],
        children: [
          DOMBuilder.td({
            classes:  ['list-item-check'],
            children: [DOMBuilder.checkbox()]
          }),
          DOMBuilder.td({
            classes:  ['list-item-id'],
            children: [DOMBuilder.text(element.issue_id)]
          }),
          DOMBuilder.td({
            classes:  ['list-item-name'],
            dataset:  {id: element.id},
            children: [DOMBuilder.text(element.subject)]
          }),
          DOMBuilder.td({
            classes:  ['list-item-status'],
            children: [
              DOMBuilder.span({
                classes:  ['list-item-status-name'],
                children: [
                  DOMBuilder.text(element.status ? element.status.name : 'Untested')
                ]
              }),
              DOMBuilder.select({
                classes: ['list-item-select'],
                dataset: {
                  id:                  element.id,
                  test_case_status_id: element.status ? element.status.test_case_status_id : null
                },
                children: DOMBuilder.options({
                  data:         data.execution_results,
                  includeBlank: element.status ? false : true,
                  selected:     element.status ? element.status.id : null,
                  textField:    'name',
                  valueField:   'id'
                })
              })
            ]
          })
        ]
      })

      caseList.push(node)
      this.listItems[element.id.toString()] = node
    }.bind(this))

    children[0].appendChild(
      DOMBuilder.tbody({classes: ['case-list-body'], children: caseList})
    )

    return DOMBuilder.div({
      classes:  ['case-list-root'],
      children: children
    })
  }

  def.buildExecutionSuiteActions = function (executionSuite) {

    this.suiteActions.appendChild(
      DOMBuilder.link({
        classes:  ['execution-list-edit', 'icon-only', 'icon-edit'],
        dataset:  {id: executionSuite.id},
        href:     '#',
        title:    'Edit execution suite',
        children: [DOMBuilder.text('Edit')]
      })
    )
    this.suiteActions.appendChild(
      DOMBuilder.link({
        classes:  ['execution-list-delete', 'icon-only', 'icon-del'],
        href:     '#',
        title:    'Delete execution suite',
        dataset:  {id: executionSuite.id},
        children: [DOMBuilder.text('Delete')]
      })
    )
  }

  // loadExecutionSuite :: Int | String
  def.loadExecutionSuite = function (executionId) {
    var params = {
      id:   executionId,
      done: function (response) {
        this.createExecutionSuiteBody(response)
      }.bind(this),
      fail: function (response) { console.log(response) }
    }

    Redcaser.API.executionSuites.show(params)
  }

  return self
})()
