import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  update,
  onValue,
  orderByChild,
} from "firebase/database";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCnH-fcWM6vQ1p-PQc-qcCx4uWFZ43tRZQ",
  authDomain: "forprogwork-f252d.firebaseapp.com",
  projectId: "forprogwork-f252d",
  storageBucket: "forprogwork-f252d.appspot.com",
  messagingSenderId: "221039711286",
  appId: "1:221039711286:web:c967c07208f3d82a4d7497",
  databaseURL:
    "https://forprogwork-f252d-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Функція наглядача стану автентифікації
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Користувач увійшов у систему
    const hideRegistrationScreen = document.querySelector(".registration");
    hideRegistrationScreen.style.display = "none";
    const hideLoginScreen = document.querySelector(".login");
    hideLoginScreen.style.display = "none";
    console.log("Користувач увійшов у систему:", user);
    // Отримання додаткових даних користувача
    const uid = user.uid;
    console.log("Додаткові дані користувача:", uid);

    const addRecipe = document.querySelector(".add-recipe");
    const addIngredientFieldBtn = document.querySelector(".add-btn");
    const saveNewRecipeBtn = document.querySelector(".add-all-btn");
    let countField = 2;

    const ingredientsArr = [];
    const recipeObj = new Object();
    const allIngredientsSet = new Set();
    const newIngredientsSet = new Set();

    function setAllIngredients() {
      onValue(ref(database), (snapshot) => {
        const data = snapshot.val();
        console.log(data);

        for (const recipeId in data.recipe) {
          const recipe = data.recipe[recipeId];

          for (const dishKey in recipe) {
            const dish = recipe[dishKey];
            const ingredients = dish.ingredients;

            ingredients.forEach((ingredient) =>
              allIngredientsSet.add(ingredient)
            );
          }
        }

        console.log(allIngredientsSet);
        showAllIngredients();
      });
    }

    setAllIngredients();

    function showAllIngredients() {
      const container = document.querySelector(".ingredients");
      const paragraphs = container.querySelectorAll("p");

      paragraphs.forEach(function (paragraph) {
        paragraph.remove();
      });

      const sortedIngredients = Array.from(allIngredientsSet).sort();

      sortedIngredients.forEach((ingredient) => {
        const paragraph = document.createElement("p");
        paragraph.classList.add("ingr-item");
        paragraph.textContent = ingredient;

        // Додавання атрибутів для перетягування (drag)
        paragraph.setAttribute("draggable", "true");

        // Додавання обробників подій для перетягування (drag)
        paragraph.addEventListener("dragstart", handleDragStart);
        paragraph.addEventListener("dragend", handleDragEnd);

        container.appendChild(paragraph);
      });
    }

    // Обробник події 'dragstart'
    function handleDragStart(event) {
      // Збереження текстового вмісту перетягуваного елемента
      event.dataTransfer.setData("text/plain", event.target.textContent);

      event.target.setAttribute("data-ingredient", event.target.textContent);

      // Задання ефекту перетягування (copy або move)
      event.dataTransfer.effectAllowed = "move";

      // Додавання класу для стилізації перетягуваного елемента
      event.target.classList.add("dragging");
    }

    // Обробник події 'dragend'
    function handleDragEnd(event) {
      // Видалення класу для стилізації перетягуваного елемента
      event.target.classList.remove("dragging");
    }

    // Обробник події 'dragover' для нового контейнера
    const mainContainer = document.querySelector(".ingredients-main");
    mainContainer.addEventListener("dragover", handleDragOver);

    // Обробник події 'drop' для нового контейнера
    mainContainer.addEventListener("drop", handleDrop);

    // Обробник події 'dragover' для дозволу на перетягування в новий контейнер
    function handleDragOver(event) {
      event.preventDefault();
    }

    // Обробник події 'drop' для розміщення елемента в новому контейнері
    function handleDrop(event) {
      event.preventDefault();

      // Отримання текстового вмісту перетягуваного елемента
      const ingredient = event.dataTransfer.getData("text/plain");

      // Перевірка, чи існує елемент зі вмістом ingredient у першому контейнері
      const paragraph = document.querySelector(
        ".ingredients p.ingr-item[data-ingredient='" + ingredient + "']"
      );
      if (paragraph) {
        paragraph.remove();
      }

      // Видалення елемента з allIngredientsSet
      allIngredientsSet.delete(ingredient);

      // Додавання елемента до newIngredientsSet
      newIngredientsSet.add(ingredient);
      console.log(newIngredientsSet);

      // Створення нового <p> елемента в новому контейнері
      const newParagraph = document.createElement("p");
      newParagraph.classList.add("ingr-item");
      newParagraph.textContent = ingredient;
      newParagraph.addEventListener("click", function () {
        newParagraph.remove();
        newIngredientsSet.delete(ingredient);
        allIngredientsSet.add(ingredient);
        console.log(allIngredientsSet);
        showAllIngredients();
        searchRecipeInDb();
      });
      event.target.appendChild(newParagraph);
      searchRecipeInDb();
    }

    function searchRecipeInDb() {
      const recipesRef = ref(database, "recipe");
      const recipeInfoElement = document.querySelector(".recipe-info");
      recipeInfoElement.innerHTML = "";

      // Перебирайте рецепти, використовуючи сортування за інгредієнтами
      onValue(recipesRef, (snapshot) => {
        const data = snapshot.val();

        for (const userId in data) {
          const userRecipes = data[userId];

          for (const recipeId in userRecipes) {
            const recipe = userRecipes[recipeId];
            const recipeIngredients = recipe.ingredients;

            // Перевіряємо, чи є хоча б одне співпадіння інгредієнтів зі Set
            const hasMatch = recipeIngredients.some((ingredient) =>
              newIngredientsSet.has(ingredient)
            );

            // Якщо є хоча б одне співпадіння, виводимо рецепт
            if (hasMatch) {
              console.log("Збіг з рецептом", recipe.title);
              // Ваша додаткова логіка тут;

              const recipeDiv = document.createElement("div");

              const recipeTitle = document.createElement("h2");
              recipeTitle.textContent = recipe.title;
              recipeTitle.addEventListener("click", () => {
                openModal(recipe);
              });
              recipeDiv.appendChild(recipeTitle);

              const ingredientsParagraph = document.createElement("p");
              const ingredientsText = recipeIngredients
                .map((ingredient) =>
                  newIngredientsSet.has(ingredient)
                    ? `<span class="highlighted-ingredient">${ingredient}</span>`
                    : ingredient
                )
                .join(", ");
              ingredientsParagraph.innerHTML =
                "Інгредієнти: " + ingredientsText;
              recipeDiv.appendChild(ingredientsParagraph);

              const descriptionParagraph = document.createElement("p");
              const descriptionText = truncateText(recipe.description, 5); // Обмеження до 10 слів
              descriptionParagraph.textContent = "Опис: " + descriptionText;
              recipeDiv.appendChild(descriptionParagraph);

              recipeInfoElement.appendChild(recipeDiv);
            }
          }
        }
      });
    }

    function truncateText(text, limit) {
      const words = text.split(" ");
      if (words.length > limit) {
        return words.slice(0, limit).join(" ") + "...";
      }
      return text;
    }

    // Функція для відкриття модального вікна з повною інформацією про рецепт
    function openModal(recipe) {
      const modal = document.createElement("div");
      modal.classList.add("modal");

      const modalContent = document.createElement("div");
      modalContent.classList.add("modal-content");

      const recipeTitle = document.createElement("h1");
      recipeTitle.textContent = recipe.title;
      modalContent.appendChild(recipeTitle);

      const ingredientsParagraph = document.createElement("p");
      const ingredientsText = recipe.ingredients.join(", ");
      ingredientsParagraph.innerHTML = "Інгредієнти: " + ingredientsText;
      modalContent.appendChild(ingredientsParagraph);

      const descriptionParagraph = document.createElement("p");
      descriptionParagraph.textContent = "Опис: " + recipe.description;
      modalContent.appendChild(descriptionParagraph);

      modal.appendChild(modalContent);

      document.body.appendChild(modal);

      // Додайте обробник події, щоб закрити модальне вікно при натисканні на будь-який області поза вмістом модального вікна
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          closeModal();
        }
      });
    }

    // Функція для закриття модального вікна
    function closeModal() {
      const modal = document.querySelector(".modal");
      document.body.removeChild(modal);
    }

    function addRecipeToDb(title, user) {
      update(ref(database, "recipe/" + user), {
        [title]: recipeObj,
      });
    }

    function showModalAddRecipe() {
      const modalAdd = document.querySelector(".modal-add");
      const modalAddWindow = document.querySelector(".modal-add-window");
      modalAdd.style.display =
        modalAdd.style.display === "flex" ? "none" : "flex";
      modalAddWindow.style.display =
        modalAddWindow.style.display === "flex" ? "none" : "flex";

      modalAddWindow.addEventListener("click", hideModalAddRecipe);
    }

    function hideModalAddRecipe() {
      const modalAdd = document.querySelector(".modal-add");
      const modalAddWindow = document.querySelector(".modal-add-window");

      modalAdd.style.display = "none";
      modalAddWindow.style.display = "none";
    }

    addRecipe.addEventListener("click", showModalAddRecipe);

    function addIngredientField() {
      const ingredientField = document.querySelector(".ingr-field");
      ingredientField.insertAdjacentHTML(
        "beforeend",
        `<input placeholder="${countField}. (Додавайте по одному інгредієнту)" class="ingredient-field" type="text" />`
      );
      countField += 1;
    }

    addIngredientFieldBtn.addEventListener("click", addIngredientField);

    function saveNewRecipe() {
      const ingrArr = document.getElementsByClassName("ingredient-field");
      const titleRecipe = document.querySelector(".title-recipe");
      const descRecipe = document.getElementById("recipe-desc");

      for (let i = 0; i < ingrArr.length; i++) {
        if (ingrArr[i].value) {
          ingredientsArr.push(ingrArr[i].value);
        } else {
          alert("Введіть хочаб один інгредієнт!");
        }
      }

      if (titleRecipe.value && descRecipe.value && ingredientsArr) {
        recipeObj["title"] = titleRecipe.value;
        recipeObj["description"] = descRecipe.value;
        recipeObj["ingredients"] = ingredientsArr;

        addRecipeToDb(recipeObj.title, uid);
        hideModalAddRecipe();
      } else {
        alert("Заповніть всі поля!");
      }

      console.log(recipeObj);
    }

    saveNewRecipeBtn.addEventListener("click", saveNewRecipe);

    // Додайте додаткову логіку або перенаправлення користувача
  } else {
    // Користувач вийшов з системи або не увійшов
    console.log("Користувач вийшов з системи або не увійшов");
    const showRegistrationScreen = document.querySelector(".registration");
    showRegistrationScreen.style.display = "flex";
    // Додайте додаткову логіку або перенаправлення користувача
  }
});

// Обробка форми реєстрації при надсиланні
const registrationForm = document.getElementById("registration-form");
registrationForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // Перехоплення стандартної поведінки форми

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // Реєстрація користувача з використанням електронної пошти та пароля
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    // Користувач успішно зареєстрований
    const user = userCredential.user;
    console.log("Користувач успішно зареєстрований:", user);

    const hideRegistrationScreen = document.querySelector(".registration");
    hideRegistrationScreen.style.display = "none";
    const hideLoginScreen = document.querySelector(".login");
    hideLoginScreen.style.display = "none";
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(
      "Помилка під час реєстрації користувача:",
      errorCode,
      errorMessage
    );
    // Обробка помилки
    if (errorCode === "auth/email-already-in-use") {
      showErrorMessage("Email вже використовується");
    } else if (errorCode === "auth/weak-password") {
      showErrorMessage("Закороткий пароль");
    }
  }
});

// Обробка форми логіну при надсиланні
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // Перехоплення стандартної поведінки форми

  const email = document.getElementById("email-login").value;
  const password = document.getElementById("password-login").value;

  try {
    // Логін користувача з використанням електронної пошти та пароля
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    // Користувач успішно увійшов
    const user = userCredential.user;
    console.log("Користувач успішно увійшов:", user);

    const hideLoginScreen = document.querySelector(".login");
    hideLoginScreen.style.display = "none";
    const hideRegistrationScreen = document.querySelector(".registration");
    hideRegistrationScreen.style.display = "none";
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log("Помилка під час логіну користувача:", errorCode, errorMessage);
    // Обробка помилки
    if (errorCode === "auth/wrong-password") {
      showErrorMessage("Неправильний пароль");
    } else if (errorCode === "auth/user-not-found") {
      showErrorMessage("Email не зареєстровано");
    } else if (errorCode === "auth/too-many-requests") {
      showErrorMessage("Тимчасово недоступно. Спробуйте пізніше");
    }
  }
});

function showErrorMessage(message) {
  const windowForMessage = document.querySelector(".bottom-window");
  const messageError = document.querySelector(".bottom-mess");

  messageError.textContent = message;
  windowForMessage.style.display = "flex";
  windowForMessage.classList.add("animate-in");
  setTimeout(() => {
    windowForMessage.classList.remove("animate-in");
    windowForMessage.classList.add("animate-out");
    setTimeout(() => {
      windowForMessage.style.display = "none";
      windowForMessage.classList.remove("animate-out");
    }, 200);
  }, 3000);
}

// Функція виходу користувача
const logoutButton = document.getElementById("logout-btn");
logoutButton.addEventListener("click", async function () {
  try {
    // Вихід користувача
    await signOut(auth);
    console.log("Користувач вийшов з системи");
    // Додайте додаткову логіку або перенаправлення користувача
  } catch (error) {
    console.log("Помилка під час виходу користувача:", error);
    // Обробка помилки
  }
});

function switchFromSingupToLogin() {
  const hideRegistrationScreen = document.querySelector(".registration");
  hideRegistrationScreen.style.display = "none";
  const showLoginScreen = document.querySelector(".login");
  showLoginScreen.style.display = "flex";
}

const switchLoginBtn = document.querySelector(".switch-login");
switchLoginBtn.addEventListener("click", switchFromSingupToLogin);

function switchFromLoginToSignUp() {
  const hideLoginScreen = document.querySelector(".login");
  hideLoginScreen.style.display = "none";
  const showSignupScreen = document.querySelector(".registration");
  showSignupScreen.style.display = "flex";
}

const switchSignupBtn = document.querySelector(".switch-signup");
switchSignupBtn.addEventListener("click", switchFromLoginToSignUp);
