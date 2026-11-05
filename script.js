
/* ==========================================
   LAKBAY MARINDUQUE
   MAIN JAVASCRIPT
   ========================================== */


/* ==========================================
   1. APPLICATION DATA AND STATE
   ========================================== */

const STORAGE_KEYS = {
    favorites: "lakbay_favorites",
    trips: "lakbay_saved_trips",
    itinerary: "lakbay_current_itinerary"
};

let destinations = [];

let favorites = loadStorage(STORAGE_KEYS.favorites, []);
let savedTrips = loadStorage(STORAGE_KEYS.trips, []);
let itinerary = loadStorage(STORAGE_KEYS.itinerary, []);

let selectedDestination = null;

let activeCategory = "all";


/* ==========================================
   2. LOCAL STORAGE HELPERS
   ========================================== */

function loadStorage(key, fallback) {
    try {
        const stored = localStorage.getItem(key);

        if (stored === null) {
            return fallback;
        }

        const parsed = JSON.parse(stored);

        return parsed ?? fallback;

    } catch (error) {
        console.error("Unable to read local storage:", error);
        return fallback;
    }
}


function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;

    } catch (error) {
        console.error("Unable to save data:", error);
        showToast("Unable to save. Check your browser storage.");
        return false;
    }
}


/* ==========================================
   3. INITIALIZE WEBSITE
   ========================================== */

document.addEventListener("DOMContentLoaded", initializeApp);


async function initializeApp() {

    setupNavigation();
    setupEventListeners();

    await loadDestinations();

    renderAll();

    document.getElementById("tripTitle").value = "";

    setupBootstrapToast();
}


/* ==========================================
   4. LOAD DESTINATIONS FROM JSON
   ========================================== */

async function loadDestinations() {

    const grid = document.getElementById("destinationGrid");

    grid.innerHTML = `
        <div class="saved-empty">
            <i class="bi bi-arrow-repeat"></i>
            Loading destinations...
        </div>
    `;

    try {

        const response = await fetch("destinations.json");

        if (!response.ok) {
            throw new Error("Unable to load destinations.json");
        }

        destinations = await response.json();

        if (!Array.isArray(destinations)) {
            throw new Error("Invalid destination data.");
        }

    } catch (error) {

        console.error(error);

        grid.innerHTML = `
            <div class="saved-empty">
                <i class="bi bi-exclamation-circle"></i>
                Unable to load destination information.
                Please run this project using VS Code Live Server
                and check destinations.json.
            </div>
        `;

        destinations = [];
    }
}


/* ==========================================
   5. RENDER ALL SECTIONS
   ========================================== */

function renderAll() {

    renderDestinations();
    renderPlannerDestinations();
    renderItinerary();
    renderFavorites();
    renderSavedTrips();
    updateSummary();
}


/* ==========================================
   6. DESTINATION DIRECTORY
   ========================================== */

function renderDestinations() {

    const grid = document.getElementById("destinationGrid");
    const noResults = document.getElementById("noResults");

    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const municipality = document.getElementById("municipalityFilter")
        .value;

    const category = document.getElementById("categoryFilter")
        .value;

    const filtered = destinations.filter(destination => {

        const searchableText = [
            destination.name,
            destination.municipality,
            destination.category,
            destination.shortDescription,
            destination.description,
            destination.background
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(search);

        const matchesMunicipality =
            municipality === "all" ||
            destination.municipality === municipality;

        const matchesCategory =
            category === "all" ||
            destination.category === category;

        const matchesChip =
            activeCategory === "all" ||
            destination.category === activeCategory;

        return matchesSearch &&
            matchesMunicipality &&
            matchesCategory &&
            matchesChip;
    });

    document.getElementById("destinationCount").textContent =
        filtered.length.toString().padStart(2, "0");

    if (filtered.length === 0) {

        grid.innerHTML = "";
        noResults.hidden = false;

        return;
    }

    noResults.hidden = true;

    grid.innerHTML = filtered.map(destination => {

        const isFavorite = favorites.includes(destination.id);

        return `
            <article class="destination-card">

                <div class="destination-photo-wrap">

                    <img
                        src="${escapeHTML(destination.image)}"
                        alt="${escapeHTML(destination.name)}"
                        class="destination-photo"
                        loading="lazy"
                    >

                    <div class="destination-photo-overlay"></div>

                    <span class="photo-category">
                        ${escapeHTML(destination.category.toUpperCase())}
                    </span>

                    <button
                        type="button"
                        class="favorite-button ${isFavorite ? "is-favorite" : ""}"
                        data-favorite="${destination.id}"
                        aria-label="${isFavorite ? "Remove from" : "Add to"} favorites"
                        aria-pressed="${isFavorite}"
                        title="${isFavorite ? "Remove favorite" : "Save favorite"}"
                    >
                        <i class="bi ${isFavorite ? "bi-heart-fill" : "bi-heart"}"></i>
                    </button>

                </div>

                <div class="destination-card-body">

                    <div class="destination-location">
                        <i class="bi bi-geo-alt-fill"></i>
                        ${escapeHTML(destination.municipality)}, Marinduque
                    </div>

                    <h3>${escapeHTML(destination.name)}</h3>

                    <p>${escapeHTML(destination.shortDescription)}</p>

                    <div class="destination-card-actions">

                        <button
                            type="button"
                            class="details-link"
                            data-details="${destination.id}"
                        >
                            Explore details
                            <i class="bi bi-arrow-up-right"></i>
                        </button>

                        <button
                            type="button"
                            class="add-place-button"
                            data-add="${destination.id}"
                        >
                            <i class="bi bi-plus-lg"></i>
                            Add to trip
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");

    // Show a fallback if an image cannot be loaded.
    grid.querySelectorAll(".destination-photo").forEach(img => {

        img.addEventListener("error", function () {
            this.src = "https://placehold.co/900x600/e9eee6/355b45?text=Destination+Photo";
        }, { once: true });

    });
}


/* ==========================================
   7. CATEGORY FILTER BUTTONS
   ========================================== */

function updateCategoryButtons() {

    document.querySelectorAll(".category-chip").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.category === activeCategory
        );

    });
}


/* ==========================================
   8. DESTINATION DETAILS
   ========================================== */

function openDestinationDetails(id) {

    const destination = destinations.find(item => item.id === id);

    if (!destination) {
        return;
    }

    selectedDestination = destination;

    document.getElementById("modalImage").src = destination.image;
    document.getElementById("modalImage").alt = destination.name;

    document.getElementById("modalCategory").textContent =
        destination.category;

    document.getElementById("modalLocation").textContent =
        destination.municipality + ", Marinduque";

    document.getElementById("modalTitle").textContent =
        destination.name;

    document.getElementById("modalDescription").textContent =
        destination.description;

    document.getElementById("modalBackground").textContent =
        destination.background;

    document.getElementById("modalTravelInfo").textContent =
        destination.travelInfo;

    updateModalFavoriteButton();

    const modalElement = document.getElementById("destinationModal");

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();
}


function updateModalFavoriteButton() {

    if (!selectedDestination) {
        return;
    }

    const button = document.getElementById("modalFavorite");

    const isFavorite = favorites.includes(selectedDestination.id);

    button.innerHTML = isFavorite
        ? '<i class="bi bi-heart-fill"></i> Remove from favorites'
        : '<i class="bi bi-heart"></i> Save to favorites';
}


/* ==========================================
   9. FAVORITES / BOOKMARKS
   ========================================== */

function toggleFavorite(id) {

    const destination = destinations.find(item => item.id === id);

    if (!destination) {
        return;
    }

    const index = favorites.indexOf(id);

    if (index === -1) {

        favorites.push(id);

        if (!saveStorage(STORAGE_KEYS.favorites, favorites)) {
            favorites.pop();
            return;
        }

        showToast(destination.name + " added to favorites.");

    } else {

        favorites.splice(index, 1);

        if (!saveStorage(STORAGE_KEYS.favorites, favorites)) {
            favorites.push(id);
            return;
        }

        showToast(destination.name + " removed from favorites.");
    }

    renderDestinations();
    renderFavorites();
    updateSummary();
    updateModalFavoriteButton();
}


function renderFavorites() {

    const grid = document.getElementById("favoritesGrid");

    const favoriteDestinations = destinations.filter(
        destination => favorites.includes(destination.id)
    );

    document.getElementById("favoriteHeadingCount").textContent =
        favoriteDestinations.length + " saved";

    if (favoriteDestinations.length === 0) {

        grid.innerHTML = `
            <div class="saved-empty">
                <i class="bi bi-heart"></i>
                <strong>No favorite destinations yet.</strong><br>
                Save places from the destination directory
                to keep them here.
            </div>
        `;

        return;
    }

    grid.innerHTML = favoriteDestinations.map(destination => `

        <article class="saved-place-card">

            <img
                src="${escapeHTML(destination.image)}"
                alt="${escapeHTML(destination.name)}"
                loading="lazy"
            >

            <div class="saved-place-info">

                <h6>${escapeHTML(destination.name)}</h6>

                <small>
                    ${escapeHTML(destination.municipality)}, Marinduque
                </small>

                <div class="saved-place-actions">

                    <button type="button"
                        data-details="${destination.id}">
                        View
                    </button>

                    <button type="button"
                        data-remove-favorite="${destination.id}">
                        Remove
                    </button>

                </div>

            </div>

        </article>

    `).join("");
}


/* ==========================================
   10. INTERACTIVE ITINERARY PLANNER
   ========================================== */

function addToItinerary(id) {

    const destination = destinations.find(item => item.id === id);

    if (!destination) {
        return;
    }

    if (itinerary.includes(id)) {

        showToast("This destination is already in your itinerary.");
        return;
    }

    itinerary.push(id);

    if (!saveStorage(STORAGE_KEYS.itinerary, itinerary)) {
        itinerary.pop();
        return;
    }

    renderItinerary();
    renderPlannerDestinations();

    showToast(destination.name + " added to your itinerary.");
}


function renderPlannerDestinations() {

    const list = document.getElementById("plannerDestinationList");

    const search = document.getElementById("plannerSearch")
        .value.trim().toLowerCase();

    const filtered = destinations.filter(destination => {

        const text = (
            destination.name + " " + destination.municipality
        ).toLowerCase();

        return text.includes(search);
    });

    if (filtered.length === 0) {

        list.innerHTML = `
            <div class="saved-empty">
                No destinations match your search.
            </div>
        `;

        return;
    }

    list.innerHTML = filtered.map(destination => {

        const alreadyAdded = itinerary.includes(destination.id);

        return `

            <div class="planner-destination-option">

                <img
                    src="${escapeHTML(destination.image)}"
                    alt=""
                    loading="lazy"
                >

                <div class="planner-option-info">

                    <h6>${escapeHTML(destination.name)}</h6>

                    <small>
                        ${escapeHTML(destination.municipality)} ·
                        ${escapeHTML(destination.category)}
                    </small>

                </div>

                <button
                    type="button"
                    class="planner-add"
                    data-add="${destination.id}"
                    ${alreadyAdded ? "disabled" : ""}
                    aria-label="Add ${escapeHTML(destination.name)}"
                    title="${alreadyAdded ? "Already added" : "Add to itinerary"}"
                >
                    <i class="bi ${alreadyAdded ? "bi-check-lg" : "bi-plus-lg"}"></i>
                </button>

            </div>

        `;

    }).join("");
}


function renderItinerary() {

    const list = document.getElementById("itineraryList");

    const selected = itinerary.map(id =>
        destinations.find(destination => destination.id === id)
    ).filter(Boolean);

    document.getElementById("itineraryCount").textContent =
        selected.length + (selected.length === 1 ? " place" : " places");

    if (selected.length === 0) {

        list.innerHTML = `
            <div class="itinerary-empty">

                <div class="empty-icon">
                    <i class="bi bi-map"></i>
                </div>

                <h5>Your journey starts here</h5>

                <p>
                    Select destinations from the left
                    to start building your itinerary.
                </p>

            </div>
        `;

        return;
    }

    list.innerHTML = selected.map((destination, index) => `

        <div class="itinerary-item">

            <div class="itinerary-number">
                ${index + 1}
            </div>

            <div class="itinerary-item-info">

                <h6>${escapeHTML(destination.name)}</h6>

                <small>
                    ${escapeHTML(destination.municipality)}, Marinduque
                </small>

            </div>

            <div class="itinerary-actions">

                <button type="button"
                    data-move-up="${destination.id}"
                    aria-label="Move ${escapeHTML(destination.name)} up"
                    title="Move up"
                    ${index === 0 ? "disabled" : ""}>
                    <i class="bi bi-arrow-up"></i>
                </button>

                <button type="button"
                    data-move-down="${destination.id}"
                    aria-label="Move ${escapeHTML(destination.name)} down"
                    title="Move down"
                    ${index === selected.length - 1 ? "disabled" : ""}>
                    <i class="bi bi-arrow-down"></i>
                </button>

                <button type="button"
                    class="remove-item"
                    data-remove-itinerary="${destination.id}"
                    aria-label="Remove ${escapeHTML(destination.name)}"
                    title="Remove">
                    <i class="bi bi-x-lg"></i>
                </button>

            </div>

        </div>

    `).join("");
}


function moveItineraryItem(id, direction) {

    const currentIndex = itinerary.indexOf(id);

    if (currentIndex === -1) {
        return;
    }

    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= itinerary.length) {
        return;
    }

    const temp = itinerary[currentIndex];

    itinerary[currentIndex] = itinerary[newIndex];
    itinerary[newIndex] = temp;

    if (!saveStorage(STORAGE_KEYS.itinerary, itinerary)) {
        itinerary[currentIndex] = itinerary[newIndex];
        itinerary[newIndex] = temp;
        return;
    }

    renderItinerary();
    renderPlannerDestinations();
}


function removeFromItinerary(id) {

    const destination = destinations.find(item => item.id === id);

    const oldItinerary = [...itinerary];

    itinerary = itinerary.filter(itemId => itemId !== id);

    if (!saveStorage(STORAGE_KEYS.itinerary, itinerary)) {
        itinerary = oldItinerary;
        return;
    }

    renderItinerary();
    renderPlannerDestinations();

    showToast(
        (destination ? destination.name : "Destination") +
        " removed from itinerary."
    );
}


function clearItinerary() {

    if (itinerary.length === 0) {
        showToast("Your itinerary is already empty.");
        return;
    }

    if (!confirm("Are you sure you want to clear your current itinerary?")) {
        return;
    }

    itinerary = [];

    if (!saveStorage(STORAGE_KEYS.itinerary, itinerary)) {
        return;
    }

    renderItinerary();
    renderPlannerDestinations();

    showToast("Your itinerary has been cleared.");
}


/* ==========================================
   11. SAVE AND RESTORE TRIPS
   ========================================== */

function saveCurrentTrip() {

    if (itinerary.length === 0) {

        showToast("Add at least one destination before saving.");
        return;
    }

    const titleInput = document.getElementById("tripTitle");

    const title = titleInput.value.trim() || "My Marinduque Trip";

    const newTrip = {
        id: Date.now(),
        title: title,
        destinationIds: [...itinerary],
        createdAt: new Date().toISOString()
    };

    savedTrips.unshift(newTrip);

    if (!saveStorage(STORAGE_KEYS.trips, savedTrips)) {
        savedTrips.shift();
        return;
    }

    renderSavedTrips();
    updateSummary();

    showToast("Your trip has been saved.");

    titleInput.value = "";
}


function renderSavedTrips() {

    const grid = document.getElementById("savedTripsGrid");

    document.getElementById("tripHeadingCount").textContent =
        savedTrips.length + " saved";

    if (savedTrips.length === 0) {

        grid.innerHTML = `
            <div class="saved-empty">
                <i class="bi bi-bookmark"></i>
                <strong>No saved trips yet.</strong><br>
                Create an itinerary and save it to keep it here.
            </div>
        `;

        return;
    }

    grid.innerHTML = savedTrips.map(trip => {

        const tripDestinations = trip.destinationIds.map(id =>
            destinations.find(destination => destination.id === id)
        ).filter(Boolean);

        const destinationNames = tripDestinations
            .map(destination => destination.name)
            .join(", ");

        const date = new Date(trip.createdAt).toLocaleDateString(
            "en-PH",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

        return `

            <article class="saved-trip-card">

                <div class="saved-trip-top">

                    <div>
                        <h5>${escapeHTML(trip.title)}</h5>

                        <p>
                            ${tripDestinations.length}
                            ${tripDestinations.length === 1 ? "destination" : "destinations"}
                        </p>
                    </div>

                    <i class="bi bi-bookmark-star-fill"
                        style="color: #c69d59; font-size: 22px;"></i>

                </div>

                <p>${escapeHTML(destinationNames)}</p>

                <span class="trip-date">
                    SAVED ${escapeHTML(date.toUpperCase())}
                </span>

                <div class="saved-trip-actions">

                    <button type="button"
                        data-load-trip="${trip.id}">
                        <i class="bi bi-arrow-counterclockwise"></i>
                        Load trip
                    </button>

                    <button type="button"
                        class="delete-trip"
                        data-delete-trip="${trip.id}">
                        <i class="bi bi-trash"></i>
                        Delete
                    </button>

                </div>

            </article>

        `;

    }).join("");
}


function loadSavedTrip(id) {

    const trip = savedTrips.find(item => item.id === id);

    if (!trip) {
        return;
    }

    const validIds = trip.destinationIds.filter(id =>
        destinations.some(destination => destination.id === id)
    );

    const oldItinerary = [...itinerary];

    itinerary = [...validIds];

    if (!saveStorage(STORAGE_KEYS.itinerary, itinerary)) {
        itinerary = oldItinerary;
        return;
    }

    document.getElementById("tripTitle").value = trip.title;

    renderItinerary();
    renderPlannerDestinations();

    document.getElementById("planner").scrollIntoView({
        behavior: "smooth"
    });

    showToast("Saved trip loaded successfully.");
}


function deleteSavedTrip(id) {

    const trip = savedTrips.find(item => item.id === id);

    if (!trip) {
        return;
    }

    if (!confirm("Delete the saved trip '" + trip.title + "'?")) {
        return;
    }

    const oldTrips = [...savedTrips];

    savedTrips = savedTrips.filter(item => item.id !== id);

    if (!saveStorage(STORAGE_KEYS.trips, savedTrips)) {
        savedTrips = oldTrips;
        return;
    }

    renderSavedTrips();
    updateSummary();

    showToast("Saved trip deleted.");
}


/* ==========================================
   12. UPDATE COUNTS
   ========================================== */

function updateSummary() {

    document.getElementById("favoriteCount").textContent =
        favorites.length;

    document.getElementById("savedTripCount").textContent =
        savedTrips.length;
}


/* ==========================================
   13. EVENT LISTENERS
   ========================================== */

function setupEventListeners() {

    // Destination search
    document.getElementById("searchInput")
        .addEventListener("input", renderDestinations);

    // Clear search
    document.getElementById("clearSearch")
        .addEventListener("click", () => {

            document.getElementById("searchInput").value = "";

            renderDestinations();

        });

    // Municipality filter
    document.getElementById("municipalityFilter")
        .addEventListener("change", renderDestinations);

    // Category filter
    document.getElementById("categoryFilter")
        .addEventListener("change", renderDestinations);

    // Category chips
    document.querySelectorAll(".category-chip").forEach(button => {

        button.addEventListener("click", () => {

            activeCategory = button.dataset.category;

            document.getElementById("categoryFilter").value = "all";

            updateCategoryButtons();
            renderDestinations();

        });

    });

    // Reset all filters
    document.getElementById("resetFilters")
        .addEventListener("click", resetFilters);

    document.getElementById("emptyReset")
        .addEventListener("click", resetFilters);

    // Planner search
    document.getElementById("plannerSearch")
        .addEventListener("input", renderPlannerDestinations);

    // Clear itinerary
    document.getElementById("clearItinerary")
        .addEventListener("click", clearItinerary);

    // Save trip
    document.getElementById("saveTrip")
        .addEventListener("click", saveCurrentTrip);

    // Modal favorite
    document.getElementById("modalFavorite")
        .addEventListener("click", () => {

            if (selectedDestination) {
                toggleFavorite(selectedDestination.id);
            }

        });

    // Modal add to itinerary
    document.getElementById("modalAddItinerary")
        .addEventListener("click", () => {

            if (selectedDestination) {
                addToItinerary(selectedDestination.id);
            }

        });

    // Event delegation for generated elements
    document.addEventListener("click", handleDynamicActions);
}


/* ==========================================
   14. DYNAMIC BUTTON HANDLER
   ========================================== */

function handleDynamicActions(event) {

    const target = event.target.closest("button");

    if (!target) {
        return;
    }

    // Favorite buttons
    if (target.dataset.favorite) {
        toggleFavorite(Number(target.dataset.favorite));
        return;
    }

    // Destination details
    if (target.dataset.details) {
        openDestinationDetails(Number(target.dataset.details));
        return;
    }

    // Add destination
    if (target.dataset.add) {
        addToItinerary(Number(target.dataset.add));
        return;
    }

    // Remove favorite
    if (target.dataset.removeFavorite) {
        toggleFavorite(Number(target.dataset.removeFavorite));
        return;
    }

    // Remove itinerary item
    if (target.dataset.removeItinerary) {
        removeFromItinerary(Number(target.dataset.removeItinerary));
        return;
    }

    // Move up
    if (target.dataset.moveUp) {
        moveItineraryItem(Number(target.dataset.moveUp), -1);
        return;
    }

    // Move down
    if (target.dataset.moveDown) {
        moveItineraryItem(Number(target.dataset.moveDown), 1);
        return;
    }

    // Load saved trip
    if (target.dataset.loadTrip) {
        loadSavedTrip(Number(target.dataset.loadTrip));
        return;
    }

    // Delete saved trip
    if (target.dataset.deleteTrip) {
        deleteSavedTrip(Number(target.dataset.deleteTrip));
    }
}


/* ==========================================
   15. RESET FILTERS
   ========================================== */

function resetFilters() {

    document.getElementById("searchInput").value = "";

    document.getElementById("municipalityFilter").value = "all";

    document.getElementById("categoryFilter").value = "all";

    activeCategory = "all";

    updateCategoryButtons();
    renderDestinations();
}


/* ==========================================
   16. NAVIGATION EFFECTS
   ========================================== */

function setupNavigation() {

    const navbar = document.getElementById("mainNavbar");

    window.addEventListener("scroll", () => {

        navbar.classList.toggle("scrolled", window.scrollY > 30);

    });

    // Close mobile navigation after selecting a link
    document.querySelectorAll(".navbar-nav .nav-link, .nav-cta")
        .forEach(link => {

            link.addEventListener("click", () => {

                const menu = document.getElementById("navbarMenu");

                if (menu.classList.contains("show")) {

                    bootstrap.Collapse.getOrCreateInstance(menu).hide();

                }

            });

        });
}


/* ==========================================
   17. TOAST NOTIFICATIONS
   ========================================== */

let appToast;


function setupBootstrapToast() {

    const toastElement = document.getElementById("appToast");

    appToast = bootstrap.Toast.getOrCreateInstance(toastElement, {
        delay: 2500
    });
}


function showToast(message) {

    document.getElementById("toastMessage").textContent = message;

    if (appToast) {
        appToast.show();
    } else {
        alert(message);
    }
}


/* ==========================================
   18. BASIC HTML ESCAPING
   ========================================== */

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => {

        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return characters[character];
    });
}
