import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';

import * as d3 from 'd3-selection';
import * as d3Parser from 'd3-dsv';

import * as i from './interfaces';
import * as u from './utils';

import {
  Grid,
  GridOptions,
  ModuleRegistry,
  ColDef,
} from '@ag-grid-community/core';

import { LicenseManager } from '@ag-grid-enterprise/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { CsvExportModule } from '@ag-grid-community/csv-export';

import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { MultiFilterModule } from '@ag-grid-enterprise/multi-filter';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { SideBarModule } from '@ag-grid-enterprise/side-bar';
import { StatusBarModule } from '@ag-grid-enterprise/status-bar';

import '@ag-grid-community/core/dist/styles/ag-grid.css';
import '@ag-grid-community/core/dist/styles/ag-theme-balham.css';
import '@ag-grid-community/core/dist/styles/ag-theme-balham-dark.css';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CsvExportModule,
  ClipboardModule,
  ColumnsToolPanelModule,
  ExcelExportModule,
  FiltersToolPanelModule,
  MultiFilterModule,
  RangeSelectionModule,
  RowGroupingModule,
  SetFilterModule,
  SideBarModule,
  StatusBarModule,
]);

LicenseManager.setLicenseKey('__AGGRID_LICENCE_KEY__');

const MIME_TYPE = 'text/csv';
const CLASS_NAME = 'mimerenderer-aggrid';
const THEME_MODE_BODY_ATTRIBUTE = 'data-jp-theme-light';

/**
 * widget for rendering .dot.
 */
export class AggridWidget extends Widget implements IRenderMime.IRenderer {
  private _mimeType: string;
  private _data: string;

  private _wrapperViz: i.d3SelectDiv;
  private _vizGrid: i.d3SelectDiv;
  private _gridOptions: GridOptions;
  private _isThemeDark: boolean;

  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    console.log('start AggridWidget constructor');

    super();
    this._mimeType = options.mimeType;

    this.id = `node-${u.uuid()}`;
    this.addClass(CLASS_NAME);

    const root = d3.select(this.node);

    this._wrapperViz = root.append('div').attr('class', 'wrapper-viz');

    this._isThemeDark =
      document.body.getAttribute(THEME_MODE_BODY_ATTRIBUTE) === 'false';
  }

  /**
   * render .dot into widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    console.log('start AggridWidget renderModel');

    this._data = model.data[this._mimeType] as string;
    return this.drawAggrid({ data: this._data, reset: false });
  }

  /**
   * main action entrypoint
   */
  async drawAggrid({ data, reset }: i.IParamsDrawAggrid): Promise<void> {
    console.log('--- start AggridWidget drawAggrid');

    const root = this._wrapperViz;

    const vizExists = !root.select('#viz').empty();

    if (vizExists && !reset) {
      console.log('>>> grid already exists and not reset - SKIP');
      return;
    }
    if (vizExists) {
      console.log('>>> remove existing element');
      root.select('#viz').remove();
    }

    this._vizGrid = root.append('div');
    this._vizGrid.attr('id', 'viz');

    if (this._isThemeDark) {
      this._vizGrid.attr('class', 'ag-theme-balham-dark');
    } else {
      this._vizGrid.attr('class', 'ag-theme-balham');
    }

    const _data_json = d3Parser.csvParse(data, d3Parser.autoType);
    console.log(_data_json);

    const colDefs: GridOptions['columnDefs'] = [];
    Object.entries(_data_json[0]).forEach(([k, v]) => {
      const e: ColDef = { field: k };
      if (u.isNumeric(v)) {
        e.filter = 'agNumberColumnFilter';
      } else {
        e.filter = 'agMultiColumnFilter';
        // e.filter = 'agTextColumnFilter';
      }
      colDefs.push(e);
    });
    console.log(colDefs);

    const onGridReady = () => {
      console.log('onGridReady');
    };

    this._gridOptions = {
      columnDefs: colDefs,
      rowData: _data_json,
      defaultColDef: {
        flex: 1,
        editable: false,
        resizable: true,
        sortable: true,
        filter: true,
      },
      animateRows: false,
      suppressColumnVirtualisation: true,
      enableRangeSelection: true,
      onGridReady: onGridReady,

      sideBar: {
        toolPanels: [
          {
            id: 'columns',
            labelDefault: 'Columns',
            labelKey: 'columns',
            iconKey: 'columns',
            toolPanel: 'agColumnsToolPanel',
          },
          {
            id: 'filters',
            labelDefault: 'Filters',
            labelKey: 'filters',
            iconKey: 'filter',
            toolPanel: 'agFiltersToolPanel',
          },
        ],
        position: 'right',
        defaultToolPanel: null,
      },

      statusBar: {
        statusPanels: [
          {
            statusPanel: 'agTotalAndFilteredRowCountComponent',
            align: 'left',
          },
          {
            statusPanel: 'agAggregationComponent',
            align: 'right',
          },
        ],
      },
    };
    console.log(this._gridOptions);

    const divGrid = this._vizGrid.node();
    new Grid(divGrid, this._gridOptions);
  }
}

/**
 * A mime renderer factory for .dot data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: (options) => new AggridWidget(options),
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: 'jupyterlab-aggrid:plugin',
  rendererFactory,
  rank: 100,
  dataType: 'string',
  fileTypes: [
    {
      name: 'csv',
      iconClass: 'jp-MaterialIcon mimerenderer-aggrid-icon',
      fileFormat: 'text',
      mimeTypes: [MIME_TYPE],
      extensions: ['.csv'],
    },
  ],
  documentWidgetFactoryOptions: {
    name: 'Ag Grid',
    primaryFileType: 'csv',
    fileTypes: ['csv'],
    defaultFor: ['csv'],
  },
};

export default extension;
