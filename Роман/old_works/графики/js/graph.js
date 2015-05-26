// Отступы
var margin = {top: 100, right: 10, bottom: 30, left: 40};
var width_svg = 900,
    height_svg = 500,
    width = width_svg - margin.left - margin.right,
    height = height_svg - margin.top - margin.bottom,
    width_month = width/60,
    margin_legend = 15;

// Формат дат (для парсинга из файла)
var parseDate = d3.time.format("%Y-%m").parse;

// Шкалы
var x = d3.time.scale()
    .rangeRound([0, width])
    .nice();

var y = d3.scale.linear()
    .rangeRound([height, 0]);

// Русская локаль
ru = {
  "decimal": ",",
  "thousands": "\xa0",
  "grouping": [3],
  "currency": ["", " руб."],
  "dateTime": "%A, %e %B %Y г. %X",
  "date": "%d.%m.%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  "shortDays": ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  "months": ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  "shortMonths": ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
};

// Оси
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height)
    .tickPadding(5)
    .tickFormat(d3.locale(ru).timeFormat("%b"));

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickSize(-width)
    .tickPadding(5)
    .ticks(5)
    .tickFormat(d3.format(ru));


// Стиль линий
var line = d3.svg.line()
    .interpolate("monotone")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.frequency); });

// Создаём svg
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var words_list;

// Загрузка данных
function load_chart(file_name) {
  svg.selectAll("g").remove(); // удаляем все предыдущие топы
  d3.tsv(file_name, function(error, data) {
    // Привязываем цвета к ключам
    words_list = d3.keys(data[0]).filter(function(key) { return key !== "date"; });
    color.domain(words_list);

    // Преобразуем даты
    data.forEach(function(d) {
      d.date = parseDate(d.date);
    });

    // Преобразуем значения
    var words = color.domain().map(function(name) {
      return {
        name: name,
        values: data.map(function(d) {
          return {date: d.date, frequency: +d[name]};
        })
      };
    });

    // Диапазон значений дат для шкалы X
    x.domain(d3.extent(data, function(d) { return d.date; }));

    // Диапазон значений для шкалы Y
    y.domain([
      d3.min(words, function(c) { return d3.min(c.values, function(v) { return v.frequency; }); }),
      d3.max(words, function(c) { return d3.max(c.values, function(v) { return v.frequency; }); })
    ]);

    // Добавляем ось X
    xAx = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Добавляем подписи и линии-разделители для годов
    for (i=0; i<=4; i++) {
      xAx.append("line")
        .attr("class", "line_years")
        .attr("x1", x(parseDate(2011+i + "-01")))
        .attr("x2", x(parseDate(2011+i + "-01")))
        .attr("y2", -height);
      xAx.append("text")
        .attr("class", "text_years")
        .attr("x", x(parseDate(2010+i + "-07")))
        .attr("y", 30)
        .text(2010+i);
    }

    // Добавляем ось Y
    yAx = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    yAx_label = yAx.append("text")
        .attr("transform", "translate(" + (-margin.left + 12) + "," + (-10) + ")")
        .text("Количество запросов о слове на миллион запросов о незнакомых словах");

    xAx.append("line")
        .attr("class", "line_bottom")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", 2)
        .attr("y2", 2);

    // Добавляем слова
    var word = svg.selectAll(".word")
        .data(words)
      .enter().insert("g", ".axis")
        .attr("class", "word")
        .attr("id", function(d) { return "i" + d.name.replace(/[ ()",]/g, "_"); });

    // Добавляем линии
    word.append("path")
        .attr("class", "line disable")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return color(d.name); });

    // Добавляем легенду
    var word_legend = word.append("g")
        .attr("class", "legend disable")
        .attr("transform", function(d, i) {
          if (i<5) {trans = "translate(" + (i%5*width_svg/5 - margin.left + 12) + "," + (-margin.top + margin_legend) + ")"; }
          else if (i<10) {trans = "translate(" + (i%5*width_svg/5 - margin.left + 12) + "," + (-margin.top + margin_legend + 15) + ")"; }
          else if (i<15) {trans = "translate(" + (i%5*width_svg/5 - margin.left + 12) + "," + (-margin.top + margin_legend + 30) + ")"; }
          else if (i<20) {trans = "translate(" + (i%5*width_svg/5 - margin.left + 12) + "," + (-margin.top + margin_legend + 45) + ")"; }
          return trans;
        });

    // Добавляем квадратик
    var word_rect = word_legend.append("rect")
        .attr("y", -8)
        .attr("width", "8px")
        .attr("height", "8px")
        .style("fill", function(d) { return color(d.name); });
    word_legend.append("path")
        .attr("d", "M0,-4 4,0 8,-8");

    // Добавляем текст
    word_legend.append("text")
        .attr("x", 12)
        .text(function(d) { return d.name; });

    // Вешаем события
    word_legend.on("click", function(d) {
        select_word = d3.select("#i" + d.name.replace(/[ ()",]/g, "_"));
        select_line = select_word.select('.line');
        select_line.classed("disable", select_line.attr("class") !== "line disable");
        select_legend = select_word.select('.legend');
        select_legend.classed("disable", select_legend.attr("class") !== "legend disable");
    });

    // Врубаем слова
    for (i=0; i<5; i++) {
        select_word = d3.select("#i" + words_list[i].replace(/[ ()",]/g, "_"));
        select_line = select_word.select('.line');
        select_line.classed("disable", select_line.attr("class") !== "line disable");
        select_legend = select_word.select('.legend');
        select_legend.classed("disable", select_legend.attr("class") !== "legend disable");
    }
  });
}