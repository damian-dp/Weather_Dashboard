import { toggleTheme, handleButtonMouseLeave } from './theme.js';
import { addNewCard, updateAllCards } from './cardManager.js';
import { debounce } from './utils.js';

export function initializeEventListeners() {
    const lightModeToggle = document.getElementById('light-mode-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const tempToggle = document.getElementById("temp-toggle");

    if (lightModeToggle) {
        lightModeToggle.addEventListener('click', toggleTheme);
        lightModeToggle.addEventListener('mouseleave', () => handleButtonMouseLeave(lightModeToggle));
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleTheme);
        darkModeToggle.addEventListener('mouseleave', () => handleButtonMouseLeave(darkModeToggle));
    }

    if (tempToggle) {
        tempToggle.addEventListener("change", async () => {
            const currentUnits = tempToggle.checked ? "imperial" : "metric";
            await updateAllCards(currentUnits);
        });
    }

    addAddCardEventListener();
}

export function addAddCardEventListener() {
    const addCardButton = document.getElementById("add-card");
    if (addCardButton && !addCardButton.hasAddCardListener) {
        addCardButton.addEventListener("click", async () => {
            const location = prompt("Please enter a location:");
            if (location) {
                await addNewCard(location);
            }
        });
        addCardButton.hasAddCardListener = true;
    }
}

export const debouncedAddNewCard = debounce(addNewCard, 300);