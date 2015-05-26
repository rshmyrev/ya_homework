// Отступы
var margin = {top: 50, right: 20, bottom: 0, left: 110},
    width = 450 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    width_chart = width + margin.left + margin.right,
    height_chart = height + margin.top + margin.bottom;

// Шкалы
var x = d3.scale.linear()
    .rangeRound([0, width])
    .domain([0, 6000]);

var y_left = d3.scale.ordinal()
    .rangeRoundBands([0, height], 0.5);

var y_right = d3.scale.ordinal()
    .rangeRoundBands([0, height], 0.5);

// Ось X
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top")
    .tickSize(-height)
    .ticks(5)
    .tickFormat(d3.format('ru_RU'));

// Создаём svg
var svg = d3.select("#chart")
    .attr("width", width_chart*2)
    .attr("height", height_chart);

// Объявление переменных
var words,                  // данные
    timeout,                // время анимации
    year_left   = 2010,     // год на топе слева
    year_right  = 2011,     // год на топе справ
    anim        = false,    // происходит ли сейчас анимация
    shift_delay     = 0,    // задержка перед перемещением ленты
    shift_time      = 400,  // время перемещения ленты
    transit_delay1  = 0 + shift_delay + shift_time; // задержка перед перемещением обших баров
    transit_time1   = 400,  // время перемещения обших баров
    transit_delay2  = 0 + transit_delay1 + transit_time1, // задержка перед ранжированием обших баров
    transit_time2   = 350,  // время ранжирования обших баров
    transit_delay3  = 0 + transit_delay2 + transit_time2, // задержка перед перемещением новых баров
    transit_time3   = 350,  // время перемещения новых баров
    transit_delay4  = 350 + transit_delay3 + transit_time3, // задержка перед изменением ширины столбиков
    transit_time4   = 500,  // время изменения ширины столбиков
    anim_time       = 350 + transit_delay4 + transit_time4; // общее время анимации


// Загрузка данных
d3.tsv("calendar.tsv", function(error, data) {
// d3.tsv("http://localhost:8000/calendar.tsv", function(error, data) {
  words = data;
  redraw_static();
  back_button.attr("disabled", true);   // делаем недоступной кнопку "Назад"
  forw_button.attr("disabled", null);   // делаем доступной кнопку "Вперед"

  // Вешаем события на легенду
  legend_old = d3.select("#legend").select(".bar.old");
  legend_old.on("mouseover", function() {
      d3.selectAll(".old")
          .attr("class", "bar old choise");
  });
  legend_old.on("mouseout", function() {
      d3.selectAll(".old")
          .attr("class", "bar old");
  });

  legend_new = d3.select("#legend").select(".bar.new");
  legend_new.on("mouseover", function() {
      d3.selectAll(".new")
          .attr("class", "bar new choise");
  });
  legend_new.on("mouseout", function() {
      d3.selectAll(".new")
          .attr("class", "bar new");
  });
});


// Этап 0. Подготовка. Отбираем топ-25 для каждого объекта. Меняем оси ординат
function draw0(year1, year2) {
  year_left = year1 || year_left;
  year_right = year2 || year_right;
  // Только первые 25 объектов (сортировка по выбранному году)
  top_left = words.sort(function(a, b) { return b[year_left] - a[year_left]; }).slice(0, 25);
  top_right = words.sort(function(a, b) { return b[year_right] - a[year_right]; }).slice(0, 25);

  // Список слов в каждом топе
  words_left = top_left.map(function(d) { return d.word; });
  words_right = top_right.map(function(d) { return d.word; });

  // Определяем domain для шкал ординат
  y_left.domain(words_left);
  y_right.domain(words_right);
}


// Этап 1. Создаём окно для топа, ось и название
function draw1(year, translateX) {
  // Создаём новый топ
  var chart = svg.append("g")
      .attr("class", "chart new")
      .attr("transform", "translate(" + translateX + "," + margin.top + ")");

  // Добавляем ось
  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + 6 + ")")
      .call(xAxis);

  // Добавляем подпись оси
  var x_axis_label = chart.append("g")
      .attr("class", "x axis label")
      .attr("transform", "translate(" + -4 + "," + 3 + ")")
    .append("text")
      .attr("class", "x axis label")
      .attr("dy", "-2em")
      .text("Количество запросов о слове на миллион запросов о незнакомых словах");

  // Добавляем название
  chart.append("g")
      .attr("class", "chart name")
      .attr("transform", "translate(" + width/2 + "," + -40 + ")")
    .append("text")
        .attr("class", "chart name")
        .attr("text-anchor", "middle")
        .text(year);
}


// Этап 2. Cоздаём бары
function draw2(year, y_top, y_top_not_common, top_data, words_other, bar_other, translateX_not_common, translateY_not_common, translateX_common, translateY_common) {
  // Cоздаём бары и прикрепляем данные
  var chart = svg.select(".chart.new");
  var bar = chart.selectAll(".bar")
      .data(top_data, function(d) { return d.word; });

  // Добавляем созданные бары в топ, даём им id и общий класс
  var bar_Enter = bar.enter().insert("g", ".axis")
      .attr("class", "bar common")
      .attr("id", function(d) { return "i" + d.word.replace(/ /g, "_"); });

  // Добавляем в бары столбики
  bar_Enter.append("rect")
      .attr("width", function(d) { return x(d[year]); })
      .attr("height", y_top.rangeBand());

  // Добавляем в бары лэйблы
  bar_Enter.append("text")
      .attr("class", "label")
      .attr("x", -10)
      .attr("y", y_top.rangeBand() / 2)
      .attr("dy", ".3em")
      .attr("text-anchor", "end")
      .text(function(d) { return d.word; });

  // Меняем класс для различающихся столбиков и смещаем на свои позиции
  var bar_not_common = bar_Enter.filter(function(d) {
        if (words_other.every(function(e, i, a) {return d.word != e;}))
        return true;
      })
      .attr("class", "bar " + bar_other)
      .attr("transform", function(d) { return "translate(" + translateX_not_common + "," + (y_top_not_common(d.word) + translateY_not_common) + ")"; });

  // Смещаем обшие бары
  bar_common = chart.selectAll(".bar.common")
      .attr("transform", function(d) { return "translate(" + translateX_common + "," + (y_top(d.word) + translateY_common) + ")"; });

  // Вешаем события на общие бары
  bar_common.on("mouseover", function(d) {
      d3.selectAll("#i" + d.word.replace(/ /g, "_"))
          .attr("class", "bar common choise");
  });
  bar_common.on("mouseout", function(d) {
      d3.selectAll("#i" + d.word.replace(/ /g, "_"))
          .attr("class", "bar common");
  });

  // Вешаем события на отличающиеся бары
  bar_not_common.on("mouseover", function(d) {
      d3.select("#i" + d.word.replace(/ /g, "_"))
          .attr("class", "bar " + bar_other + " choise");
      d3.select("#legend").select(".bar." + bar_other)
          .attr("class", "bar " + bar_other + " choise");
  });
  bar_not_common.on("mouseout", function(d) {
      d3.select("#i" + d.word.replace(/ /g, "_"))
          .attr("class", "bar " + bar_other);
      d3.select("#legend").select(".bar." + bar_other + ".choise")
          .attr("class", "bar " + bar_other);
  });
}


// Этап 3. Сдвигаем ленту, меняем классы топов
function draw_shift(direction) {
  // Условия и определение переменных
  if (direction == "forward") {
    var delete_top = "left",
        shift_top = "right",
        delete_translateX = margin.left - width_chart,
        shift_translateX = delete_translateX + width_chart,
        new_translateX = shift_translateX + width_chart,
        words_other = words_right,
        bar_other = "old";
  } else {
    var delete_top = "right",
        shift_top = "left",
        delete_translateX =  margin.left + width_chart*2,
        shift_translateX = delete_translateX - width_chart,
        new_translateX = shift_translateX - width_chart,
        words_other = words_left,
        bar_other = "new";
  }

  // Сдвигаем и удаляем топ1
  svg.select(".chart." + delete_top)
      .transition()
      .duration(shift_time)
      .attr("transform", "translate(" + delete_translateX + "," + margin.top + ")")
      .remove();

  // Сдвигаем топ2 и меняем ему класс
  var chart = svg.select(".chart." + shift_top)
      .attr("class", "chart " + delete_top)
      .transition()
      .duration(shift_time)
      .attr("transform", "translate(" + shift_translateX + "," + margin.top + ")");

  // Перемещаем новый топ и меняем ему класс
  svg.select(".chart.new")
      .attr("class", "chart " + shift_top)
      .transition()
      .duration(shift_time)
      .attr("transform", "translate(" + new_translateX + "," + margin.top + ")");
}


// Мгновенная перерисовка картинки
function redraw_static() {
  svg.selectAll("g").remove(); // удаляем все предыдущие топы
  draw0();

  // Левый топ
  draw1(year_left, margin.left);
  draw2(year_left, y_left, y_left, top_left, words_right, "old", 0, 0, 0, 0);
  svg.select(".chart.new").attr("class", "chart left");

  // Правый топ
  draw1(year_right, (margin.left + width_chart));
  draw2(year_right, y_right, y_right, top_right, words_left, "new", 0, 0, 0, 0);
  svg.select(".chart.new").attr("class", "chart right");
}


// Перерисовка картинки при движении назад
function redraw_shift_prev() {
  draw0();

  // Перерисовываем левый топ
  svg.select(".chart.left").remove(); // удаляем левый топ
  draw1(year_right, margin.left);
  draw2(year_right, y_right, y_right, top_right, words_left, "new", 0, 0, 0, 0);
  svg.select(".chart.new").attr("class", "chart left");

  // Создаём новый топ
  draw1(year_left, (margin.left - width_chart));
  draw2(year_left, y_left, y_left, top_left, words_right, "old", 0, 0, 0, 0);

  draw_shift("backward");
}


// Перерисовка картинки при движении вперед
function redraw_shift_next() {
  draw0();

  // Перерисовываем правый топ
  svg.select(".chart.right").remove(); // удаляем правый топ
  draw1(year_left, (margin.left + width_chart));
  draw2(year_left, y_left, y_left, top_left, words_right, "old", 0, 0, 0, 0);
  svg.select(".chart.new").attr("class", "chart right");

  // Создаём новый топ
  draw1(year_right, (margin.left + width_chart*2));
  draw2(year_left, y_left, y_right, top_right, words_left, "new", 0, height_chart, (-width_chart), 0);

  draw_shift("forward");

  var right_chart       = svg.select(".chart.right"),
      bar_right         = right_chart.selectAll(".bar"),
      bar_right_new     = right_chart.selectAll(".bar.new"),
      bar_right_common  = right_chart.selectAll(".bar.common");

  bar_right.style("fill-opacity", 0);

  // Этап 4. Анимация переходов
  // 4.1. Перемещаем общие бары в новый топ
  bar_right_common.transition()
      .duration(transit_time1)
      .attr("transform", function(d) { return "translate(0," + (y_left(d.word)) + ")"; })
      .style("fill-opacity", 1);

  // 4.2. Ранжируем общие бары
  bar_right_common.transition()
      .ease('quart-in-out')
      .delay(transit_delay2)
      .duration(transit_time2)
      .attr("transform", function(d) { return "translate(0," + (y_right(d.word)) + ")"; });

  // 4.3. Перемещаем новые бары в новый топ и делаем видимыми
  bar_right_new.transition()
      .ease('quart-in-out')
      .delay(transit_delay3)
      .duration(transit_time3)
      .attr("transform", function(d) { return "translate(0," + (y_right(d.word)) + ")"; })
      .style("fill-opacity", 1);

  // Этап 4.4. Изменяем ширину всех баров на новую
  bar_right.selectAll("rect").transition()
      .ease('quart-in-out')
      .delay(transit_delay4)
      .duration(transit_time4)
      .attr("width", function(d) { return x(d[year_right]); });
}


// Увеличиваем год, запускаем таймер и вызываем функцию прорисовки следующего года
function next_year() {
    anim = true; // анимация началась
    year_left++;
    year_right++;
    timeout = setTimeout(function() {anim = false;}, anim_time);
    redraw_shift_next();
}

// Уменьшаем год, запускаем таймер и вызываем функцию прорисовки предыдущего года
function prev_year() {
    anim = true; // анимация началась
    year_left--;
    year_right--;
    timeout = setTimeout(function() {anim = false;}, (shift_time + 500));
    redraw_shift_prev();
}


// Выбираем кнопки
var forw_button = d3.select("#forward");
var back_button = d3.select("#backward");

// Кнопка "Вперед"
forw_button.on("click", function() {
  back_button.attr("disabled", null); // делаем доступной кнопку "Назад"
  if (year_right >= 2013) { // Если это предпоследний слайд
    forw_button.attr("disabled", true); // делаем недоступной кнопку "Вперед"
  }

  if (!anim) {next_year();} // Если сейчас не идет анимация
  else { // если идет анимация и кнопка нажата ещё раз
    redraw_static(); // перерисовываем всю сцену
    next_year();
  }
});

// Кнопка "Назад"
back_button.on("click", function() {
  forw_button.attr("disabled", null); // делаем доступной кнопку "Вперед"
  if (year_left <= 2011) { // Если это второй слайд
    back_button.attr("disabled", true); // делаем недоступной кнопку "Назад"
  }

  if (!anim) {prev_year();} // Если сейчас не идет анимация
  else { // если идет анимация и кнопка нажата ещё раз
    redraw_static(); // перерисовываем всю сцену
    prev_year();
  }
});

var play_ico = '<svg width="10px" height="10px"><path d="M 0 0 L 0 10 L 9 5 z" /></svg>',
    next_ico = '<svg width="12px" height="10px"><path d="M 0 0 L 0 10 L 9 5 z"/><path d="M 9 10 L 11 10 L 11 0 L 9 0 z"/></svg>';
