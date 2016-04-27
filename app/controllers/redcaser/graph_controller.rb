# frozen_string_literal: true

class Redcaser::GraphController < RedcaserBaseController
  def show
    environment = ExecutionEnvironment.where(id: params[:environment_id]).first
    # TODO: This is not supposed to happen in general, only if this
    #       controller method was called at the wrong time. Unfortunately,
    #       it takes place currently, so below is a workaround to not throw
    #       an error and simply ignore the issue. This check should exist
    #       anyway, but we need to polish the API and return a JSON data
    #       with an error so the client could handle it properly.
    if !environment
      render json: {}
      return
    end
    version = Version.where(id: params[:version_id]).first
    root_execution_suite = ExecutionSuite.where(id: params[:suite_id]).first
    graph_data = TestGraph.get_data(
      version.id,
      environment.id,
      root_execution_suite.nil? ? -1 : root_execution_suite.id,
      @project.id
    )
    render json: get_json(graph_data)
  end

  private

  # TODO: This should go to some plugin's common config class.
  HIGHLIGHT_COLORS = {
    'Failed'        => '#FFCCCC',
    'Passed'        => '#C3FF76',
    'Blocked'       => '#BBBBDD',
    'Not Executed'  => '#E6E6E6',
    'Not Available' => '#2A2A2A'
  }

  # TODO: This should go to some plugin's common config class.
  COLORS = {
    'Failed'        => '#FF9999',
    'Passed'        => '#99FF33',
    'Blocked'       => '#9999CC',
    'Not Executed'  => '#FFFFFF',
    'Not Available' => '#000000'
  }

  def get_json(counts)
    counts.inject([]) { |results, (result_name, count)|
      result = {
        value: count,
        color: COLORS[result_name],
        highlight: HIGHLIGHT_COLORS[result_name],
        label: result_name
      }
      results << result
    }
  end
end
