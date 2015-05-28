// Отступы
var margin = {top: 30, right: 30, bottom: 30, left: 30},
    width = 500,
    height = 450,
    width_chart = width + margin.left + margin.right,
    height_chart = height + margin.top + margin.bottom;

// Шкалы
var x = d3.scale.linear()
    .rangeRound([0, width]);

var y = d3.scale.linear()
    .rangeRound([0, height]);

// Оси
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(3)
    .tickPadding(7);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickSize(3)
    .tickPadding(7);

var xAxis2 = d3.svg.axis()
    .scale(x)
    .orient("top")
    .tickSize(3)
    .tickPadding(7);

var yAxis2 = d3.svg.axis()
    .scale(y)
    .orient("right")
    .tickSize(3)
    .tickPadding(7);

// Цвета
var c = d3.scale.ordinal()
    .range(colorbrewer.YlOrBr[9]);

// Создаём svg
var svg = d3.select(".chart")
    .attr("width", width_chart)
    .attr("height", height_chart);

// Загрузка данных
d3.csv("../data/forestfires.csv", function(error, data) {
    data = data.map(function(d) {
      d.coord = d.X+','+d.Y;
      d.X = +d.X;
      d.Y = +d.Y;
      return d;
    });

    nest = d3.nest()
        .key(function(d) { return [d.X, d.Y]; })
        .sortKeys(d3.ascending)
        .rollup(function(e) {
          return {
            "X": e[0].X,
            "Y": e[0].Y,
            "count": e.length
          };
        })
        .entries(data);

    // Диапазоны значений шкал
    x.domain([d3.min(data, function(d) { return d.X; }), d3.max(data, function(d) { return d.X; })+1]);
    y.domain([d3.min(data, function(d) { return d.Y; }), d3.max(data, function(d) { return d.Y; })+1]);
    c.domain(d3.extent(nest, function(d) { return d.values.count; }));

    // Создаём квадраты
    var chart = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var bar = chart.selectAll("g")
      .data(nest)
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(" + x(d.values.X) + "," + y(d.values.Y) + ")"; });

    bar.append("rect")
      .attr("width", function(d) {return x(d.values.X+1) - x(d.values.X);})
      .attr("height", function(d) {return y(d.values.Y+1) - y(d.values.Y);})
      .attr("style", function(d) {return "fill: " + c(d.values.count);});

    // Добавляем текст
    bar.append("text")
      .attr("x", function(d) {return (x(d.values.X+1) - x(d.values.X))/2;})
      .attr("y", function(d) {return (y(d.values.Y+1) - y(d.values.Y))/2;})
      .attr("text-anchor", "middle")
      .attr("dy", "0.5em")
      .attr("style", "opacity: 0")
      .text(function(d) {return d.values.count;});

    // Добавляем ось X
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate("+ margin.left + "," + (margin.top+height) + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate("+ margin.left + "," + margin.top + ")")
        .call(xAxis2);

    // Добавляем ось Y
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate("+ margin.left + "," + margin.top + ")")
        .call(yAxis);
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate("+ (margin.left+width) + "," + margin.top + ")")
        .call(yAxis2);
});
