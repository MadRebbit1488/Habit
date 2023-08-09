'use strict'

// Завантаження і збереження даних
let habits = [];
const HABIT_KEY = 'HABIT_KEY';
let globalActiveHabitId;

// page - константа яка буде описувати роботу об'єкта(об'єкт описує сторінку)
const page = {
  menu: document.querySelector('.menu__list'),
  header: {
    h1: document.querySelector('.h1'),
    progressPercent: document.querySelector('.progress__percent'),
    progressCoverBar: document.querySelector('.progress__cover-bar'),
  },
  content: {
    daysConteiner: document.getElementById('days'),
    nextDay: document.querySelector('.habit__day'),
  },
  popup:  {
    index: document.getElementById('add-habit-popup'),
    iconField: document.querySelector('.popup__form input[name="icon"]'),
  }
}

//! utils
// Ф-ція отримання даних від користувача
function loadData() {
  const habitString = localStorage.getItem(HABIT_KEY);
  // тепер потрібно розпарсити отриманий рядок
  const habitArray = JSON.parse(habitString);
  // Перевірка на масив
  if(Array.isArray(habitArray)) {
    // якщо все чудово рядок кладеться в масив
    habits = habitArray;
  }
}

// Збереження даних
function saveData() {
  localStorage.setItem(HABIT_KEY, JSON.stringify(habits));
}


//! popup
// дану ф-ція потірбно буде вставити в атрибут onclick в кнопку з класом popup__close і menu__add. Тобто додавання і видалення елемента
function togglePopup() {
  // Перевірка відображений чи прихований popup
  if(page.popup.index.classList.contains('cover_hiden')) {
    // і якщо cover_hiden існує то його потрібно видалити
    page.popup.index.classList.remove('cover_hiden');
  } else {
    //Якщо класу немає то його потрібно додати
    page.popup.index.classList.add('cover_hiden');
  }
}

function resetForm(form, fields) {
  for (const field of fields) {
    form[field].value = '';
  }
}


//!валідарні ф-ції
//Ф-ція аргументом отримує форму яку потрібно завалідувати, але окрум форми потрібно додати список полів (fields) які потрібно в формі знайти і завалідувати
function validateAndGetFormData(form, fields) {
  const formData = new FormData(form);
  //обєкт який надалі буде повертатись
  const res = {};
  //Перевірка на наявність заповненості полів
  for (const field of fields) {
    const fieldValue = formData.get(field);
    form[field].classList.remove('error');
    if (!fieldValue) {
      form[field].classList.add('error');
    } 
    //Після валідації потрібно заповнити форму
    res[field] = fieldValue;
  }
  //перевірка на валідність форми. Якщо форма валідна ми можемо повернути всі поля, якщо ні то повертаємо undefined. Форма за замовчуванням валідна
  let isValid = true;
  for (const field of fields) {
    //Потрібно пройти по результуючьому об'єкту, і якщо є хочяб одне не вірне поле, то форма стає не валідною
    if (!res[field]) {
      isValid = false;
    }
  }
  //Якщо форма не валідна повертається undefined
  if (!isValid) {
    return;
  }
  //інакше ми повертаємо р-тат
  return res;
}

//! render menu
// Ф-ція rerenderMenu може рендерити меню первинно і перерндювати меню якщо щось змінилось
// Потрібен активний habit щоб правильно заренедерити меню
function rerenderMenu(activeHabit) {

  // Якщо ми знайшли активний habit, то ми повинні іти по масиву і рендерити по кожному елементу
  for(const habit of habits){
    // Перевіряємо наявність меню яку відноситься до звички
    // Знаходимо всі елемент  в яких є властивість menu-habit-id , тобто знайходимо те меню де його habit.id  йому дорівнює
    const existed = document.querySelector(`[menu-habit-id="${habit.id}"]`);
    // Якщо такого не існує, то потрібно його створити
    if(!existed){
      // Створення
      const element = document.createElement('button');
      // Додаємо атрибут по якому будемо його шукати 
      element.setAttribute('menu-habit-id', habit.id);
      // додаємо клас
      element.classList.add('menu__item');
      // Змінюємо активне меню повністю його перерендивши. ДЛя цього потрібно повішати обробник подій не елемент. Для цього потірбно викликати рірендер не тільки меню а й в подальшому контенту. Тепер елемент по якому був зроблений клік буде динамчно отримувати menu__item_active і навпаки при натисканні іншої кнопки
      element.addEventListener('click', () => rerender(habit.id));
      // Ставимо внутрішній HTML
      element.innerHTML = `<img src="/images/${habit.icon}.svg" alt="${habit.name}" />`;

      if(activeHabit.id === habit.id) {
        element.classList.add('menu__item_active');
      }
      page.menu.appendChild(element);
      // Щоб перейти до наступного елементу циклу, пысля створення елемента
      continue;
    }
    // Присвоєння класу menu__item_active
    // Якщо ми знайшли елемент ( або не знайшли і створили) і цей елемент співпадає по ідентифікатору з активним, ми йому додаємо клас menu__item_active, якщо ні ми видаляємо клас menu__item_active
    // Якщо елемент існує, то зробити перевірку чи являється він активним, тобто habit.id співпадає з тим що ми передали в habit і ми можемо його зарендерити
    if(activeHabit.id === habit.id) {
      // Кажемо що це активний елемент
      existed.classList.add('menu__item_active');
    } else {
      // Якщо ні то видаляємо class active
      existed.classList.remove('menu__item_active');
    }
  }
}


//! render шапки
// Ф-ція буде приймати activeHabit який потрібно на поточний момент зарендерити. І рендер цієї ф-ція потрібно викликати в ф-ції rerender
function rerenderHead(activeHabit) {
  // Ставимо h1 . За допомогою даного метода будуть змінюватись заголовки в шапці 
  page.header.h1.innerText = activeHabit.name;
  // Число прогресу.
  //Його потрыбно порахувати. Якщо внести більше днів ніж вказано в target, то всеодно потрібно відображати 100%.
  //Якщо до мети більше 1 тоді ми повертаємо 100, якщо ні то ми повертаємо отримане значення умножене на 100 щоб перевести його у відсоток
  const progress = activeHabit.days.length / activeHabit.target > 1 ? 100
    : activeHabit.days.length / activeHabit.target * 100;
    // Тепер прогрес потрібно внести в 2 місцях: вказати в якості відсотка і вказати смугу заповнення, тобто progress__bar
    //toFixed означає що ми будемо округлювати до цілого чила будь який прогрес, навіть дробний
    page.header.progressPercent.innerText = progress.toFixed(0) + '%';
    // В progress__bar потрібно змінювати ширину . Класом уе зробити не вийде так як може вийти дробна величина. Тому кращє поставити атрибут стиль
    page.header.progressCoverBar.setAttribute('style', `width: ${progress}%`);
}


//!Рендер днів
function rerenderContent(activeHabit) {
  // Обнуляємо дні. Тобто ми все очищаємо і для кожного дня перестворюємо
  page.content.daysConteiner.innerHTML = '';
  // Проходимось в циклі по дням. index потірбен щоб проставити номер дян
  for (const index in activeHabit.days) {
    const element = document.createElement('div');
    element.classList.add('habit');
    element.innerHTML = `<div class="habit__day">День ${Number(index) + 1}</div>
              <div class="habit__comment">${activeHabit.days[index].comment}</div>
              <button class="habit__delete" onclick="deleteDay(${index})">
                <img src="/images/delete.svg" alt="Видалити день ${index + 1}">
              </button>`;
    //Тепер створений елемент потрібно додати в якості дочірнього для  days
    page.content.daysConteiner.appendChild(element);
  }
  //Ставимо наступний день              
  page.content.nextDay.innerHTML = `День ${activeHabit.days.length + 1}`;
}



// При виклику ф-ції ми перевіряємо що в нас перерендилось меню, шапка і сам body контент
function rerender(activeHabitId){
  globalActiveHabitId = activeHabitId;
  // Щоб рендерити потірбна всі інфо про звичку
  const activeHabit = habits.find(habit => habit.id === activeHabitId);
  // Якщо в нас порожній масив і ми не знайшли активний habit, то ми повертаємось і нічього не рендеримо
  if(!activeHabit){
    return;
  }
  document.location.replace(document.location.pathname + '#' + activeHabitId);
  rerenderMenu(activeHabit);
  rerenderHead(activeHabit);
  rerenderContent(activeHabit)
}


// !FormData API - форма додавання звички
//work with days
function addDays(event) {
  // Скидає дефолтну поведінку
  event.preventDefault();

  const data = validateAndGetFormData(event.target, ['comment']);
  if(!data) {
    return;
  }
  habits = habits.map(habit => {
    // Якщо ми знайшли ту звичку яку ми зараз коментуємо
    if (habit.id === globalActiveHabitId) {
      // Тоді нам потрібно модифікувати habit
      return {
        ...habit,
        days: habit.days.concat([{ comment: data.comment }])
      }
    }
    return habit;
  });
  
  resetForm(event.target, ['comment']);
  //рірендиромо активний habit
  rerender(globalActiveHabitId);
  //Збереження даних. Без цього при обновлені сторінки дані будуть скидатись
  saveData();
}

//! Delete day
function deleteDay(index) {
  // так як глобально ми розуміємо в якій звичкі ми знаходимось нам потрібно тільки видалити індекс
  habits = habits.map(habit => {
    if (habit.id === globalActiveHabitId) {
      //Якщо це поточна активна звичка з якої ми будемо видаляти, то ми маємо видаляти дні
      habit.days.splice(index, 1);
      return {
        ...habit,
        days: habit.days
      };
    }
    //Інакше ми нічього не робимо і повертаємо habit
    return habit;
  });
  rerender(globalActiveHabitId);
  saveData();
}



//! working with habits
// Ф-цыя встановлення іконки
function setIcon(contex, icon) {
  // іcon потрібно додати в форму і змінити клас
  page.popup.iconField.value = icon;
  //Знаходимо активну іконку
  const activeIcon = document.querySelector('.icon.icon_active');
  activeIcon.classList.remove('icon_active');
  // ту іконку на яку ми натисли ми маємо додати icon_active
  contex.classList.add('icon_active');
}

//Додавання звички
function addhabit(event) {
  event.preventDefault();
  //Збирає дані з полів для валідації форми
  const data = validateAndGetFormData(event.target, ['name', 'icon', 'target']);
  if(!data) {
    return;
  }
  const maxId = habits.reduce((acc, habit) => acc > habit.id ? acc : habit.id, 0)
  habits.push({
    id: maxId + 1,
    data: data.name,
    target: data.target,
    icon: data.icon,
    days: []
  });
  //відображення
  resetForm(event.target, ['name', 'target']);
  togglePopup();
  saveData();
  rerender(maxId + 1)
}








// init
(() => {
  loadData();
  const hashId = Number(document.location.hash.replace('#', ''));
  const urlHabit = habits.find(habit => habit.id === hashId);
  if (urlHabit) {
    rerender(urlHabit.id);
  } else {
    rerender(habits[0].id)
  }
})();


