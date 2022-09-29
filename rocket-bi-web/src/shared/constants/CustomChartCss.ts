import { ChartType } from '@/shared';

export const CustomTableCss = `/* Only supported css */
table th td {
  border: 1px solid var(--neutral) !important;
}
table thead tr th {
  background-color: var(--primary) !important;
}

html, body {
  height: 100%;
  width: 100%
}

#custom-chart {
  overflow: auto;
}
::-webkit-scrollbar {
    width: 0px;  /* Remove scrollbar space */
    background: transparent;  /* Optional: just make scrollbar invisible */
}
/* Optional: show position indicator in red */
::-webkit-scrollbar-thumb {
    background: #FF0000;
}
`;
export const DefaultCss = `/* Only supported css */

`;
export const CustomLinesCss = DefaultCss;
export const CustomBarCss = DefaultCss;
export const CustomColumnCss = DefaultCss;
export const CustomAreaCss = DefaultCss;
export const CustomNumberCss = `/* Only supported css */
@import url('https://fonts.googleapis.com/css2?family=Coda+Caption:wght@800&family=Poppins:wght@500&display=swap');
body {
  text-align: center;
}
.number-container {
    font-family: 'Poppins', sans-serif;
}

.number-title {
    font-family: 'Poppins', sans-serif;
    font-size: 45px;
    font-weight: 500;
    text-transform: uppercase;
    color: #3ba338;
}

.compare-widget-content, .number-sub-title {
    font-family: 'Poppins', sans-serif;
    font-style: italic;
    font-size: 25px;
    font-weight: 500;
    text-transform: uppercase;
    color: #ff22cc;
}

.widget-number {
    font-family: 'Coda Caption', sans-serif;
    font-style: italic;
    font-size: 65px;
    font-weight: 800;
    text-transform: uppercase;
    color: #0ccac1;
}

i[class~="fa-money-bill-alt"] {
    font-size: 65px;
    color: #0ccac1;
}

.compare-widget-content {
    font-size: 30px;
}

.value-up {
    color: green;
}

.value-down {
    color: red;
}

i[class~="fa-thumbs-up"] {
    font-size: 30px;
    color: green;
}

i[class~="fa-thumbs-down"] {
    font-size: 30px;
    color: red;
}`;
export const CustomCssAsMap = new Map<ChartType, string>([
  [ChartType.Table, CustomTableCss],
  [ChartType.Line, CustomLinesCss],
  [ChartType.Column, CustomColumnCss],
  [ChartType.Bar, CustomBarCss],
  [ChartType.Area, CustomAreaCss],
  [ChartType.Kpi, CustomNumberCss]
]);
