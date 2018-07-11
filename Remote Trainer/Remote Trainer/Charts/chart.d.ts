interface JSChartLocaleOptions {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    style?: any;
    currency?: any;
    currencySymbol?: string;
    useGrouping?: boolean;
}

declare enum ChartType {
    Column,
    Bar,
    Line,
    Pie,
	Funnel
}
interface JSChartSettings {
    isVisible?: boolean;
    labelAxisTitle?: string;
    name?: string;
    noDataText?: string;
    seriesColors?: Object;
    seriesTitles?: Object;
    title?: string;
    type?: ChartType;
    valueAxisTitle?: string;
    currency?: string;
    currencySymbol?: string;
    thousandSeparator?: string;
    valuePrecision?: number;
    localeOptions?: JSChartLocaleOptions;

    jsonData?: Object;
    chartWrapper?: Object;
    chartWrapperMargin?: number;

    height?: number;
    width?: number;
    maxXLabelLength?: number;
    maxYLabelLength?: number;
    angle?: number;
    letterPixelSize?: number;
    minimumXaxisMargin?: number;
    minimumYaxisMargin?: number;
    windowRatio?: number;

    updateProperties?: (settings?: JSChartSettings) => void;
}

interface JSChart {
    settings: JSChartSettings;
    createChart: () => void;
    drawChart: (json: Object, container: HTMLElement, width: number, height: number) => void;
	//clickSerie: Resco.Event<Resco.UI.ChartViewClickEvent>;
}

interface JSChartFactory {
    new (selector?: string): JSChart;
}

declare var JSChart: JSChartFactory;
