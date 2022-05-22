import * as d3 from 'd3-selection';

type d3SelectDiv = d3.Selection<HTMLDivElement, unknown, null, undefined>;

interface IParamsDrawAggrid {
  data?: string;
  reset: boolean;
}

export { d3SelectDiv, IParamsDrawAggrid };
