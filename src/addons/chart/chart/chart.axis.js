/**
 * 图表控件 柱状
 * @class BI.AxisChart
 * @extends BI.Widget
 * leftYxis 左值轴属性
 * rightYxis 右值轴属性
 * xAxis    分类轴属性
 */
BI.AxisChart = BI.inherit(BI.AbstractChart, {

    _defaultConfig: function () {
        return BI.extend(BI.AxisChart.superclass._defaultConfig.apply(this, arguments), {
            baseCls: "bi-axis-chart"
        })
    },

    _init: function () {
        BI.AxisChart.superclass._init.apply(this, arguments);
        var self = this, o = this.options;
        this.xAxis = [{
            type: "category",
            title: {
                style: this.constants.FONT_STYLE
            },
            labelStyle: this.constants.FONT_STYLE,
            position: "bottom",
            gridLineWidth: 0
        }];
        this.combineChart = BI.createWidget({
            type: "bi.combine_chart",
            xAxis: this.xAxis,
            popupItemsGetter: o.popupItemsGetter,
            formatConfig: BI.bind(this._formatConfig, this),
            element: this.element
        });
        this.combineChart.on(BI.CombineChart.EVENT_CHANGE, function (obj) {
            self.fireEvent(BI.AxisChart.EVENT_CHANGE, obj);
        });
        this.combineChart.on(BI.CombineChart.EVENT_ITEM_CLICK, function (obj) {
            self.fireEvent(BI.AbstractChart.EVENT_ITEM_CLICK, obj)
        });
    },

    _formatConfig: function (config, items) {
        var self = this, o = this.options;
        config.colors = this.config.chartColor;
        config.style = formatChartStyle();
        formatCordon();
        this.formatChartLegend(config, this.config.chartLegend);
        config.plotOptions.dataLabels.enabled = this.config.showDataLabel;
        config.plotOptions.connectNulls = this.config.nullContinue;
        config.dataSheet.enabled = this.config.showDataTable;
        config.xAxis[0].showLabel = !config.dataSheet.enabled;
        config.zoom.zoomTool.enabled = this.config.showZoom;
        if (this.config.showZoom === true) {
            delete config.dataSheet;
            delete config.zoom.zoomType;
        }

        config.yAxis = this.yAxis;
        BI.each(config.yAxis, function (idx, axis) {
            var title;
            switch (axis.axisIndex) {
                case self.constants.LEFT_AXIS:
                    title = getXYAxisUnit(self.config.leftYAxisNumberLevel, self.constants.LEFT_AXIS);
                    axis.title.text = self.config.showLeftYAxisTitle === true ? self.config.leftYAxisTitle + title : title;
                    axis.title.rotation = self.constants.ROTATION;
                    BI.extend(axis, {
                        lineWidth: self.config.lineWidth,
                        showLabel: self.config.showLabel,
                        enableTick: self.config.enableTick,
                        reversed: self.config.leftYAxisReversed,
                        enableMinorTick: self.config.enableMinorTick,
                        gridLineWidth: self.config.showGridLine === true ? 1 : 0,
                        formatter: self.formatTickInXYaxis(self.config.leftYAxisStyle, self.config.leftYAxisNumberLevel, self.config.numSeparators)
                    });
                    self.formatNumberLevelInYaxis(config, items, self.config.leftYAxisNumberLevel, idx, axis.formatter);
                    break;
                case self.constants.RIGHT_AXIS:
                    title = getXYAxisUnit(self.config.rightYAxisNumberLevel, self.constants.RIGHT_AXIS);
                    axis.title.text = self.config.showRightYAxisTitle === true ? self.config.rightYAxisTitle + title : title;
                    axis.title.rotation = self.constants.ROTATION;
                    BI.extend(axis, {
                        lineWidth: self.config.lineWidth,
                        showLabel: self.config.showLabel,
                        enableTick: self.config.enableTick,
                        reversed: self.config.rightYAxisReversed,
                        enableMinorTIck: self.config.enableMinorTick,
                        formatter: self.formatTickInXYaxis(self.config.rightYAxisStyle, self.config.rightYAxisNumberLevel, self.config.rightNumSeparators),
                        gridLineWidth: self.config.showGridLine === true ? 1 : 0
                    });
                    self.formatNumberLevelInYaxis(config, items, self.config.rightYAxisNumberLevel, idx, axis.formatter);
                    break;
            }
        });

        config.xAxis[0].title.align = "center";
        config.xAxis[0].title.text = this.config.showXAxisTitle === true ? this.config.xAxisTitle : "";
        BI.extend(config.xAxis[0], {
            lineWidth: this.config.lineWidth,
            enableTick: this.config.enableTick,
            labelRotation: this.config.textDirection,
            enableMinorTick: this.config.enableMinorTick,
            gridLineWidth: this.config.showGridLine === true ? 1 : 0,
            maxHeight: '40%'
        });

        var lineItem = [];
        var otherItem = [];
        BI.each(items, function (idx, item) {
            if (item.type === "line") {
                lineItem.push(item);
            } else {
                otherItem.push(item);
            }
        });

        //为了给数据标签加个%,还要遍历所有的系列，唉
        this.formatDataLabel(config.plotOptions.dataLabels.enabled, items, config, this.config.chartFont);

        //全局样式的图表文字
        this.setFontStyle(this.config.chartFont, config);

        return [BI.concat(otherItem, lineItem), config];

        function formatChartStyle() {
            switch (self.config.chartStyle) {
                case BICst.CHART_STYLE.STYLE_GRADUAL:
                    return "gradual";
                case BICst.CHART_STYLE.STYLE_NORMAL:
                default:
                    return "normal";
            }
        }

        function formatCordon() {
            BI.each(self.config.cordon, function (idx, cor) {
                if (idx === 0 && self.xAxis.length > 0) {
                    var magnify = self.calcMagnify(self.config.xAxisNumberLevel);
                    self.xAxis[0].plotLines = BI.map(cor, function (i, t) {
                        return BI.extend(t, {
                            value: t.value.div(magnify),
                            width: 1,
                            label: {
                                "style" : self.config.chartFont,
                                "text": t.text,
                                "align": "top"
                            }
                        });
                    });
                }
                if (idx > 0 && self.yAxis.length >= idx) {
                    var magnify = 1;
                    switch (idx - 1) {
                        case self.constants.LEFT_AXIS:
                            magnify = self.calcMagnify(self.config.leftYAxisNumberLevel);
                            break;
                        case self.constants.RIGHT_AXIS:
                            magnify = self.calcMagnify(self.config.rightYAxisNumberLevel);
                            break;
                    }
                    self.yAxis[idx - 1].plotLines = BI.map(cor, function (i, t) {
                        return BI.extend(t, {
                            value: t.value.div(magnify),
                            width: 1,
                            label: {
                                "style" : self.config.chartFont,
                                "text": t.text,
                                "align": "left"
                            }
                        });
                    });
                }
            })
        }

        function getXYAxisUnit(numberLevelType, position) {
            var unit = "";
            switch (numberLevelType) {
                case BICst.TARGET_STYLE.NUM_LEVEL.NORMAL:
                    unit = "";
                    break;
                case BICst.TARGET_STYLE.NUM_LEVEL.TEN_THOUSAND:
                    unit = BI.i18nText("BI-Wan");
                    break;
                case BICst.TARGET_STYLE.NUM_LEVEL.MILLION:
                    unit = BI.i18nText("BI-Million");
                    break;
                case BICst.TARGET_STYLE.NUM_LEVEL.YI:
                    unit = BI.i18nText("BI-Yi");
                    break;
            }
            if (position === self.constants.X_AXIS) {
                self.config.xAxisUnit !== "" && (unit = unit + self.config.xAxisUnit)
            }
            if (position === self.constants.LEFT_AXIS) {
                self.config.leftYAxisUnit !== "" && (unit = unit + self.config.leftYAxisUnit)
            }
            if (position === self.constants.RIGHT_AXIS) {
                self.config.rightYAxisUnit !== "" && (unit = unit + self.config.rightYAxisUnit)
            }
            return unit === "" ? unit : "(" + unit + ")";
        }
    },

    populate: function (items, options, types) {
        options || (options = {});
        var self = this, c = this.constants;
        this.config = {
            leftYAxisTitle: options.leftYAxisTitle || "",
            rightYAxisTitle: options.rightYAxisTitle || "",
            chartColor: options.chartColor || [],
            chartStyle: options.chartStyle || c.NORMAL,
            leftYAxisStyle: options.leftYAxisStyle || c.NORMAL,
            rightYAxisStyle: options.rightYAxisStyle || c.NORMAL,
            showXAxisTitle: options.showXAxisTitle || false,
            showLeftYAxisTitle: options.showLeftYAxisTitle || false,
            showRightYAxisTitle: options.showRightYAxisTitle || false,
            leftYAxisReversed: options.leftYAxisReversed || false,
            rightYAxisReversed: options.rightYAxisReversed || false,
            leftYAxisNumberLevel: options.leftYAxisNumberLevel || c.NORMAL,
            rightYAxisNumberLevel: options.rightYAxisNumberLevel || c.NORMAL,
            xAxisUnit: options.xAxisUnit || "",
            leftYAxisUnit: options.leftYAxisUnit || "",
            rightYAxisUnit: options.rightYAxisUnit || "",
            xAxisTitle: options.xAxisTitle || "",
            chartLegend: options.chartLegend || c.LEGEND_BOTTOM,
            showDataLabel: options.showDataLabel || false,
            showDataTable: options.showDataTable || false,
            showGridLine: BI.isNull(options.showGridLine) ? true : options.showGridLine,
            showZoom: options.showZoom || false,
            textDirection: options.textDirection || 0,
            cordon: options.cordon || [],
            lineWidth: BI.isNull(options.lineWidth) ? 1 : options.lineWidth,
            showLabel: BI.isNull(options.showLabel) ? true : options.showLabel,
            enableTick: BI.isNull(options.enableTick) ? true : options.enableTick,
            enableMinorTick: BI.isNull(options.enableMinorTick) ? true : options.enableMinorTick,
            numSeparators: options.numSeparators || false,
            rightNumSeparators: options.rightNumSeparators || false,
            chartFont: options.chartFont || c.FONT_STYLE,
            nullContinue: true
        };
        this.options.items = items;

        this.yAxis = [];
        BI.each(types, function (idx, type) {
            if (BI.isEmptyArray(type)) {
                return;
            }
            var newYAxis = {
                type: "value",
                title: {
                    style: self.constants.FONT_STYLE
                },
                labelStyle: self.constants.FONT_STYLE,
                position: idx > 0 ? "right" : "left",
                lineWidth: 1,
                axisIndex: idx,
                gridLineWidth: 0
            };
            self.yAxis.push(newYAxis);
        });

        this.combineChart.populate(items, types);
    },

    resize: function () {
        this.combineChart.resize();
    },

    magnify: function () {
        this.combineChart.magnify();
    }
});
BI.AxisChart.EVENT_CHANGE = "EVENT_CHANGE";
BI.shortcut('bi.axis_chart', BI.AxisChart);