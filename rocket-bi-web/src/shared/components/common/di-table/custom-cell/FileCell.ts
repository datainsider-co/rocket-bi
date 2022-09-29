import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { get } from 'lodash';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { FileInfo } from '@core/lake-house';

export class FileCell implements CustomCell {
  private static readonly DirectoryIcon = require('@/assets/icon/directory.svg');
  private static readonly CSVIcon = require('@/assets/icon/data_ingestion/datasource/ic_csv_small.png');
  private static readonly ImageIcon = require('@/assets/icon/data_ingestion/datasource/ic_img.svg');
  private static readonly VideoIcon = require('@/assets/icon/data_ingestion/datasource/ic_video.svg');
  private static readonly PDFIcon = require('@/assets/icon/data_ingestion/datasource/ic_pdf.svg');
  private static readonly TextIcon = require('@/assets/icon/data_ingestion/datasource/ic_txt.svg');
  private static readonly ParquetIcon = require('@/assets/icon/data_ingestion/datasource/ic_parquet.png');

  constructor(private nameKey: string, private typeKey: string) {}

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const name = get(rowData, this.nameKey);
    const fileInfo = FileInfo.fromObject(rowData);
    const imgSrc = FileCell.iconOfFile(fileInfo);

    const elements = [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(name, 'span')];
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('directory-name-cell');
    div.setAttribute('data-title', name);
    TableTooltipUtils.configTooltip(div);
    return div;
  }

  static iconOfFile(file: FileInfo): string {
    if (file.isFolder) {
      return FileCell.DirectoryIcon;
    }
    if (file.isImage) {
      return FileCell.ImageIcon;
    }
    if (file.isParquet) {
      return FileCell.ParquetIcon;
    }
    if (file.isPdf) {
      return FileCell.PDFIcon;
    }
    if (file.isVideo) {
      return FileCell.VideoIcon;
    }
    if (file.isCsv) {
      return FileCell.CSVIcon;
    }
    return FileCell.TextIcon;
  }
}
