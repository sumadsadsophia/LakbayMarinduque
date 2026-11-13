
/* ==========================================
   LAKBAY MARINDUQUE
   MAIN JAVASCRIPT (vanilla JS, JSON, localStorage)
   ========================================== */

"use strict";

const DATA_URL = "destinations.json";
const MAX_SAVED_TRIPS = 20;
const KEY_PREFIX = "lakbay:";

const state = {
    destinations: [],
    favorites: [],
    trips: [],
    itinerary: [],
    search: "",
    municipality: "all",
    category: "all",
    interest: "all",
    selectedId: null,
    activeTripId: null,
    pendingConfirm: null,
    dataLoaded: false
};

/* ==========================================
   2. SMALL HELPERS
   ========================================== */

const $ = id => document.getElementById(id);

function esc(value) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(value ?? "").replace(/[&<>"']/g, ch => map[ch]);
}

function icon(name) {
    return `<i class="bi bi-${name}" aria-hidden="true"></i>`;
}

function normalize(text) {
    return String(text ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function plural(count, one, many) {
    return `${count} ${count === 1 ? one : many}`;
}

function formatLocation(destination) {
    const detail = destination.locationDetail
        ? `${destination.locationDetail}, `
        : "";

    return `${detail}${destination.municipality}, Marinduque`;
}

function findDestination(id) {
    return state.destinations.find(item => item.id === id);
}

function debounce(fn, delay) {
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/* ==========================================
   3. STORAGE (VALIDATED)
   ========================================== */

function readStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        showToast(
            "Your browser blocked saving. Check that storage is enabled.",
            true
        );
        return false;
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {}
}

function storageKey(name) {
    return KEY_PREFIX + name;
}

function cleanIds(value) {
    if (!Array.isArray(value)) return [];

    const valid = value
        .map(Number)
        .filter(id =>
            Number.isInteger(id) &&
            findDestination(id)
        );

    return [...new Set(valid)];
}

/*
   Generate a unique trip ID.

   Date.now() alone can produce duplicate IDs
   when users save trips very quickly.
*/

function generateTripId() {
    let id = Date.now();

    while (state.trips.some(trip => trip.id === id)) {
        id++;
    }

    return id;
}

/*
   Create a consistent destination signature.

   Destination order is ignored.

   Example:
   [1, 2, 3] and [3, 2, 1] have the same signature.
*/

function getDestinationSignature(destinationIds) {
    if (!Array.isArray(destinationIds)) return "";

    return [...new Set(destinationIds.map(Number))]
        .sort((a, b) => a - b)
        .join(",");
}

/*
   Check whether two trips contain exactly
   the same destinations, regardless of order.
*/

function haveSameDestinations(first, second) {
    const firstSignature = getDestinationSignature(first);
    const secondSignature = getDestinationSignature(second);

    return firstSignature !== "" &&
        firstSignature === secondSignature;
}

/*
   Remove previously saved duplicate trips.

   IMPORTANT:
   Trip names are NOT used to determine duplicates.

   If two trips contain the same destinations,
   only the first one is retained, even if their
   names are different.
*/

function cleanTrips(value) {
    if (!Array.isArray(value)) return [];

    const cleaned = [];
    const seenDestinations = new Set();
    const seenIds = new Set();

    value.forEach(trip => {
        if (
            !trip ||
            typeof trip.title !== "string" ||
            !Array.isArray(trip.destinationIds)
        ) {
            return;
        }

        const destinationIds = cleanIds(trip.destinationIds);

        if (destinationIds.length === 0) return;

        const signature = getDestinationSignature(destinationIds);

        // Remove trips with identical destinations.
        if (seenDestinations.has(signature)) return;

        seenDestinations.add(signature);

        let id = Number(trip.id);

        if (!Number.isSafeInteger(id) || id <= 0 || seenIds.has(id)) {
            id = Date.now();

            while (seenIds.has(id)) {
                id++;
            }
        }

        seenIds.add(id);

        cleaned.push({
            id,
            title: trip.title.trim().slice(0, 60) || "My Marinduque Trip",
            destinationIds,
            createdAt:
                typeof trip.createdAt === "string"
                    ? trip.createdAt
                    : new Date().toISOString()
        });
    });

    return cleaned;
}

function loadSavedData() {
    state.favorites = cleanIds(
        readStorage(storageKey("favorites"))
    );

    state.itinerary = cleanIds(
        readStorage(storageKey("itinerary"))
    );

    const storedTrips = readStorage(storageKey("trips"));

    state.trips = cleanTrips(storedTrips);

    // Automatically update storage if old duplicates were found.
    if (
        Array.isArray(storedTrips) &&
        state.trips.length !== storedTrips.length
    ) {
        writeStorage(storageKey("trips"), state.trips);
    }

    const title = readStorage(storageKey("tripTitle"));

    $("tripTitle").value =
        typeof title === "string"
            ? title.slice(0, 60)
            : "";

    // A fresh page load does not assume a trip is actively loaded.
    state.activeTripId = null;
}

function persist(name) {
    return writeStorage(storageKey(name), state[name]);
}

/* ==========================================
   4. DESTINATION ARTWORK
   ========================================== */

const artCache = {};

function artFor(category) {
    if (artCache[category]) return artCache[category];

    const palettes = {
        Beach: ["#A9D2E0", "#2c6577"],
        Island: ["#6aa6bb", "#14363D"],
        Heritage: ["#2c6577", "#0d2a30"],
        Culture: ["#14363D", "#7a2515"],
        Nature: ["#A9D2E0", "#14363D"]
    };

    const motifs = {
        Beach: `
            <circle cx="650" cy="170" r="70" fill="#EEF6F9" opacity=".9"/>
            <path d="M0 380Q150 350 300 380T600 380T900 380V600H0Z"
                fill="#2c6577" opacity=".6"/>
            <path d="M0 450Q150 420 300 450T600 450T900 450V600H0Z"
                fill="#14363D" opacity=".55"/>
            <path d="M0 520Q200 490 450 525T900 515V600H0Z"
                fill="#EEF6F9" opacity=".85"/>
        `,

        Island: `
            <circle cx="700" cy="140" r="52" fill="#EEF6F9" opacity=".9"/>
            <path d="M0 400Q150 370 300 400T600 400T900 400V600H0Z"
                fill="#2c6577" opacity=".55"/>
            <path d="M230 430Q430 250 650 430Z" fill="#0d2a30"/>
            <path d="M0 480Q200 450 450 485T900 475V600H0Z"
                fill="#14363D" opacity=".8"/>
        `,

        Heritage: `
            <circle cx="730" cy="140" r="50" fill="#EEF6F9" opacity=".85"/>
            <g fill="#0d2a30">
                <path d="M300 470V300L345 260L390 300V470Z"/>
                <path d="M510 470V300L555 260L600 300V470Z"/>
                <path d="M390 470V350L450 310L510 350V470Z"/>
                <path d="M200 470V420H300V470Z"/>
                <path d="M600 470V420H700V470Z"/>
            </g>
            <path d="M0 470H900V600H0Z" fill="#14363D"/>
        `,

        Culture: `
            <path d="M450 120L525 210H375Z" fill="#EEF6F9" opacity=".9"/>
            <ellipse cx="450" cy="340" rx="130" ry="170"
                fill="#EEF6F9" opacity=".92"/>
            <path d="M370 315Q400 285 430 315"
                stroke="#14363D" stroke-width="12" fill="none"
                stroke-linecap="round"/>
            <path d="M470 315Q500 285 530 315"
                stroke="#14363D" stroke-width="12" fill="none"
                stroke-linecap="round"/>
            <path d="M450 335V390"
                stroke="#14363D" stroke-width="10" stroke-linecap="round"/>
            <path d="M375 440Q450 410 525 440"
                stroke="#BD3A21" stroke-width="16" fill="none"
                stroke-linecap="round"/>
        `,

        Nature: `
            <circle cx="700" cy="130" r="48" fill="#EEF6F9" opacity=".9"/>
            <path d="M0 480L220 240L360 400L560 170L780 420L900 330V600H0Z"
                fill="#0d2a30" opacity=".85"/>
            <path d="M0 540L250 380L450 500L700 360L900 480V600H0Z"
                fill="#14363D"/>
        `
    };

    const palette = palettes[category] || palettes.Nature;
    const motif = motifs[category] || motifs.Nature;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 900 600"
            preserveAspectRatio="xMidYMid slice">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="${palette[0]}"/>
                    <stop offset="1" stop-color="${palette[1]}"/>
                </linearGradient>
            </defs>
            <rect width="900" height="600" fill="url(#g)"/>
            ${motif}
        </svg>
    `;

    artCache[category] =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(svg);

    return artCache[category];
}

function imgAttrs(destination) {
    const art = artFor(destination.category);

    if (destination.image) {
        return `src="${esc(destination.image)}" data-fallback="${esc(art)}"`;
    }

    return `src="${esc(art)}"`;
}

document.addEventListener("error", event => {
    const img = event.target;

    if (!img || img.tagName !== "IMG") return;

    if (img.dataset.fallback) {
        const fallback = img.dataset.fallback;
        delete img.dataset.fallback;
        img.src = fallback;
    } else if (img.classList.contains("hero-image")) {
        img.remove();
    }
}, true);

/* ==========================================
   5. RENDERING
   ========================================== */

function renderAll() {
    renderStats();
    renderDestinations();
    renderPlannerDestinations();
    renderItinerary();
    renderFavorites();
    renderSavedTrips();
    updateSummary();
}

function renderStats() {
    $("statDestinations").textContent = state.destinations.length;
}

/* ----- DESTINATION SEARCH AND FILTER LOGIC ----- */

function getFilteredDestinations() {
    const query = normalize(state.search);

    return state.destinations.filter(destination => {
        const searchable = normalize([
            destination.name,
            destination.municipality,
            destination.locationDetail,
            destination.category,
            (destination.interests || []).join(" "),
            destination.shortDescription,
            destination.description,
            destination.background,
            (destination.highlights || []).join(" ")
        ].join(" "));

        /*
           SEARCH PRIORITY:

           When a search query exists, ignore all other filters.
           Search checks destination names and other destination
           information independently of municipality, category,
           and browse-by-interest selections.
        */

        if (query) {
            return searchable.includes(query);
        }

        // Filters apply only when the search box is empty.
        return (
            (state.municipality === "all" ||
                destination.municipality === state.municipality) &&

            (state.category === "all" ||
                destination.category === state.category) &&

            (state.interest === "all" ||
                (destination.interests || []).includes(state.interest))
        );
    });
}

function renderDestinations() {
    const grid = $("destinationGrid");
    const noResults = $("noResults");

    if (!state.dataLoaded) return;

    const filtered = getFilteredDestinations();

    $("destinationCount").textContent = filtered.length;

    $("destinationCountLabel").textContent =
        filtered.length === 1 ? "place" : "places";

    $("clearSearch").hidden = state.search === "";

    if (filtered.length === 0) {
        grid.innerHTML = "";
        noResults.hidden = false;
        return;
    }

    noResults.hidden = true;

    grid.innerHTML = filtered.map(destination => {
        const isFavorite = state.favorites.includes(destination.id);
        const inTrip = state.itinerary.includes(destination.id);

        return `
            <article class="destination-card">
                <div class="destination-photo-wrap">
                    <img ${imgAttrs(destination)}
                        alt="${esc(destination.name)}"
                        class="destination-photo"
                        loading="lazy"
                        width="900"
                        height="600">

                    <div class="destination-photo-overlay"></div>

                    <span class="photo-category">
                        ${esc(destination.category)}
                    </span>

                    <button type="button"
                        class="favorite-button ${isFavorite ? "is-favorite" : ""}"
                        data-action="toggle-favorite"
                        data-id="${destination.id}"
                        aria-pressed="${isFavorite}"
                        aria-label="${isFavorite ? "Remove" : "Save"} ${esc(destination.name)} ${isFavorite ? "from" : "to"} favorites">
                        ${icon(isFavorite ? "heart-fill" : "heart")}
                    </button>
                </div>

                <div class="destination-card-body">
                    <div class="destination-location">
                        ${icon("geo-alt-fill")}
                        ${esc(destination.municipality)}, Marinduque
                    </div>

                    <h3>${esc(destination.name)}</h3>

                    <p>${esc(destination.shortDescription)}</p>

                    <div class="destination-card-actions">
                        <button type="button"
                            class="details-link"
                            data-action="open-details"
                            data-id="${destination.id}">
                            Explore details
                            <span class="visually-hidden">
                                for ${esc(destination.name)}
                            </span>
                            ${icon("arrow-up-right")}
                        </button>

                        <button type="button"
                            class="add-place-button"
                            data-action="add-itinerary"
                            data-id="${destination.id}"
                            ${inTrip ? "disabled" : ""}
                            aria-label="${inTrip ? esc(destination.name) + " is in your trip" : "Add " + esc(destination.name) + " to trip"}">
                            ${icon(inTrip ? "check-lg" : "plus-lg")}
                            ${inTrip ? "In trip" : "Add to trip"}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderPlannerDestinations() {
    const list = $("plannerDestinationList");
    const query = normalize($("plannerSearch").value);

    if (!state.dataLoaded) {
        list.innerHTML = "";
        return;
    }

    const filtered = state.destinations.filter(destination =>
        normalize(
            `${destination.name} ${destination.municipality} ${destination.category}`
        ).includes(query)
    );

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="saved-empty">
                No destinations match your search.
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map(destination => {
        const added = state.itinerary.includes(destination.id);

        return `
            <div class="planner-destination-option">
                <img ${imgAttrs(destination)}
                    alt=""
                    loading="lazy"
                    width="64"
                    height="56">

                <div class="planner-option-info">
                    <h4>${esc(destination.name)}</h4>
                    <small>
                        ${esc(destination.municipality)},
                        ${esc(destination.category)}
                    </small>
                </div>

                <button type="button"
                    class="planner-add"
                    data-action="add-itinerary"
                    data-id="${destination.id}"
                    ${added ? "disabled" : ""}
                    aria-label="${added ? esc(destination.name) + " already added" : "Add " + esc(destination.name) + " to itinerary"}">
                    ${icon(added ? "check-lg" : "plus-lg")}
                </button>
            </div>
        `;
    }).join("");
}

function renderItinerary() {
    const list = $("itineraryList");

    const selected = state.itinerary
        .map(findDestination)
        .filter(Boolean);

    $("itineraryCount").textContent =
        plural(selected.length, "place", "places");

    if (selected.length === 0) {
        list.innerHTML = `
            <div class="itinerary-empty">
                <div class="empty-icon">${icon("map")}</div>
                <h4>Your journey starts here</h4>
                <p>
                    Add places from the list, or load a sample trip
                    to get started.
                </p>
            </div>
        `;

        return;
    }

    list.innerHTML = `
        <ol class="list-unstyled m-0 p-0">
            ${selected.map((destination, index) => `
                <li class="itinerary-item">
                    <span class="itinerary-number" aria-hidden="true">
                        ${index + 1}
                    </span>

                    <div class="itinerary-item-info">
                        <h4>${esc(destination.name)}</h4>
                        <small>
                            ${esc(destination.municipality)}, Marinduque
                        </small>
                    </div>

                    <div class="itinerary-actions">
                        <button type="button"
                            data-action="move-up"
                            data-id="${destination.id}"
                            aria-label="Move ${esc(destination.name)} up"
                            ${index === 0 ? "disabled" : ""}>
                            ${icon("arrow-up")}
                        </button>

                        <button type="button"
                            data-action="move-down"
                            data-id="${destination.id}"
                            aria-label="Move ${esc(destination.name)} down"
                            ${index === selected.length - 1 ? "disabled" : ""}>
                            ${icon("arrow-down")}
                        </button>

                        <button type="button"
                            class="remove-item"
                            data-action="remove-itinerary"
                            data-id="${destination.id}"
                            aria-label="Remove ${esc(destination.name)}">
                            ${icon("x-lg")}
                        </button>
                    </div>
                </li>
            `).join("")}
        </ol>
    `;
}

function renderFavorites() {
    const grid = $("favoritesGrid");

    const favorites = state.favorites
        .map(findDestination)
        .filter(Boolean);

    $("favoriteHeadingCount").textContent =
        `${favorites.length} saved`;

    if (favorites.length === 0) {
        grid.innerHTML = `
            <div class="saved-empty">
                ${icon("heart")}
                <strong>No favorite destinations yet.</strong><br>
                Tap the heart on any destination card to keep it here.
            </div>
        `;

        return;
    }

    grid.innerHTML = favorites.map(destination => `
        <article class="saved-place-card">
            <img ${imgAttrs(destination)}
                alt="${esc(destination.name)}"
                loading="lazy"
                width="88"
                height="80">

            <div class="saved-place-info">
                <h4>${esc(destination.name)}</h4>

                <small>
                    ${esc(destination.municipality)}, Marinduque
                </small>

                <div class="saved-place-actions">
                    <button type="button"
                        data-action="open-details"
                        data-id="${destination.id}">
                        View
                    </button>

                    <button type="button"
                        data-action="remove-favorite"
                        data-id="${destination.id}"
                        aria-label="Remove ${esc(destination.name)} from favorites">
                        Remove
                    </button>
                </div>
            </div>
        </article>
    `).join("");
}

function renderSavedTrips() {
    const grid = $("savedTripsGrid");

    $("tripHeadingCount").textContent =
        `${state.trips.length} saved`;

    if (state.trips.length === 0) {
        grid.innerHTML = `
            <div class="saved-empty">
                ${icon("bookmark")}
                <strong>No saved trips yet.</strong><br>
                Build an itinerary and press Save this trip
                to keep it here.
            </div>
        `;

        return;
    }

    grid.innerHTML = state.trips.map(trip => {
        const names = trip.destinationIds
            .map(findDestination)
            .filter(Boolean)
            .map(item => item.name);

        const date = new Date(trip.createdAt);

        const dateLabel = Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });

        return `
            <article class="saved-trip-card">
                <div class="saved-trip-top">
                    <div>
                        <h4>${esc(trip.title)}</h4>
                        <p>
                            ${plural(names.length, "destination", "destinations")}
                        </p>
                    </div>

                    ${icon("bookmark-star-fill")}
                </div>

                <p>
                    ${esc(names.join(", ") || "No destinations")}
                </p>

                ${dateLabel
                    ? `<span class="trip-date">Saved ${esc(dateLabel)}</span>`
                    : ""
                }

                <div class="saved-trip-actions">
                    <button type="button"
                        data-action="load-trip"
                        data-id="${trip.id}">
                        ${icon("arrow-counterclockwise")}
                        Load trip
                    </button>

                    <button type="button"
                        class="delete-trip"
                        data-action="delete-trip"
                        data-id="${trip.id}">
                        ${icon("trash")}
                        Delete
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function updateSummary() {
    $("favoriteCount").textContent = state.favorites.length;
    $("savedTripCount").textContent = state.trips.length;
}

/* ==========================================
   6. ACTIONS
   ========================================== */

/* ----- Filters ----- */

function setCategory(value) {
    state.category = value;
    $("categoryFilter").value = value;
    renderDestinations();
}

function setInterest(value) {
    state.interest = value;

    document.querySelectorAll(".category-chip").forEach(chip => {
        chip.setAttribute(
            "aria-pressed",
            String(chip.dataset.interest === value)
        );
    });

    renderDestinations();
}

function resetFilters() {
    state.search = "";
    state.municipality = "all";
    state.category = "all";

    $("searchInput").value = "";
    $("municipalityFilter").value = "all";
    $("categoryFilter").value = "all";

    setInterest("all");
}

/* ----- Favorites ----- */

function toggleFavorite(id) {
    const destination = findDestination(id);

    if (!destination) return;

    const previous = [...state.favorites];
    const wasFavorite = previous.includes(id);

    state.favorites = wasFavorite
        ? previous.filter(item => item !== id)
        : [...previous, id];

    if (!persist("favorites")) {
        state.favorites = previous;
        return;
    }

    renderDestinations();
    renderFavorites();
    updateSummary();
    updateModalFavorite();

    showToast(
        `${destination.name} ${wasFavorite ? "removed from" : "added to"} favorites.`
    );
}

/* ----- Itinerary ----- */

function addToItinerary(id) {
    const destination = findDestination(id);

    if (!destination) return;

    if (state.itinerary.includes(id)) {
        showToast(
            `${destination.name} is already in your itinerary.`,
            true
        );

        return;
    }

    const previous = [...state.itinerary];
    const previousActiveTripId = state.activeTripId;

    state.itinerary = [...previous, id];
    state.activeTripId = null;

    if (!persist("itinerary")) {
        state.itinerary = previous;
        state.activeTripId = previousActiveTripId;
        return;
    }

    renderItinerary();
    renderPlannerDestinations();
    renderDestinations();
    updateModalItinerary();

    showToast(`${destination.name} added to your itinerary.`);
}

function moveItineraryItem(id, direction) {
    const from = state.itinerary.indexOf(id);
    const to = from + direction;

    if (
        from === -1 ||
        to < 0 ||
        to >= state.itinerary.length
    ) {
        return;
    }

    const previous = [...state.itinerary];
    const previousActiveTripId = state.activeTripId;
    const next = [...previous];

    [next[from], next[to]] = [next[to], next[from]];

    state.itinerary = next;
    state.activeTripId = null;

    if (!persist("itinerary")) {
        state.itinerary = previous;
        state.activeTripId = previousActiveTripId;
        return;
    }

    renderItinerary();
}

function removeFromItinerary(id) {
    const destination = findDestination(id);

    const previous = [...state.itinerary];
    const previousActiveTripId = state.activeTripId;

    state.itinerary = previous.filter(item => item !== id);
    state.activeTripId = null;

    if (!persist("itinerary")) {
        state.itinerary = previous;
        state.activeTripId = previousActiveTripId;
        return;
    }

    renderItinerary();
    renderPlannerDestinations();
    renderDestinations();
    updateModalItinerary();

    showToast(
        `${destination ? destination.name : "Destination"} removed from itinerary.`
    );
}

function clearItinerary() {
    if (state.itinerary.length === 0) {
        showToast("Your itinerary is already empty.", true);
        return;
    }

    confirmAction({
        title: "Clear itinerary?",
        message: "This removes every stop from your current plan. Saved trips are not affected.",
        okLabel: "Clear itinerary",

        onConfirm: () => {
            const previous = [...state.itinerary];
            const previousActiveTripId = state.activeTripId;

            state.itinerary = [];
            state.activeTripId = null;

            if (!persist("itinerary")) {
                state.itinerary = previous;
                state.activeTripId = previousActiveTripId;
                return;
            }

            renderItinerary();
            renderPlannerDestinations();
            renderDestinations();
            updateModalItinerary();

            showToast("Your itinerary has been cleared.");
        }
    });
}

/* ==========================================
   6.1 SAVED TRIPS
   ========================================== */

/*
   IMPORTANT DUPLICATE PREVENTION:

   A trip is considered a duplicate if its
   destination IDs are exactly the same.

   Changing the trip name will NOT bypass
   duplicate detection.

   Changing the order will NOT bypass it either.
*/

function saveCurrentTrip() {
    if (state.itinerary.length === 0) {
        showToast(
            "Add at least one destination before saving.",
            true
        );

        return;
    }

    const titleInput = $("tripTitle");

    const tripTitle =
        titleInput.value.trim() || "My Marinduque Trip";

    const destinationIds = [...state.itinerary];

    const signature = getDestinationSignature(destinationIds);

    // Validate the itinerary before saving.
    if (!signature) {
        showToast("Your itinerary contains no valid destinations.", true);
        return;
    }

    /*
       Check existing saved trips using destinations only.

       Example:

       Saved:
       Name: My Marinduque Trip
       Destinations: 1, 2, 3

       Attempt:
       Name: My Weekend Escape
       Destinations: 1, 2, 3

       RESULT: BLOCKED.
    */

    const duplicate = state.trips.find(savedTrip =>
        getDestinationSignature(savedTrip.destinationIds) === signature
    );

    if (duplicate) {
        showToast(
            `These destinations are already saved as "${duplicate.title}". Changing the trip name does not create a new trip.`,
            true
        );

        return;
    }

    if (state.trips.length >= MAX_SAVED_TRIPS) {
        showToast(
            `You can save up to ${MAX_SAVED_TRIPS} trips. Delete one to make room.`,
            true
        );

        return;
    }

    const trip = {
        id: generateTripId(),
        title: tripTitle.slice(0, 60),
        destinationIds,
        createdAt: new Date().toISOString()
    };

    const previous = [...state.trips];

    state.trips = [trip, ...previous];

    if (!persist("trips")) {
        state.trips = previous;
        return;
    }

    renderSavedTrips();
    updateSummary();

    // Clear the name after a successful save.
    titleInput.value = "";
    writeStorage(storageKey("tripTitle"), "");

    showToast(`"${trip.title}" saved successfully.`);
}

/* ----- LOAD SAVED TRIP ----- */

function loadSavedTrip(id) {
    const trip = state.trips.find(item => item.id === id);

    if (!trip) {
        showToast("This saved trip could not be found.", true);
        return;
    }

    const previous = [...state.itinerary];
    const previousActiveTripId = state.activeTripId;
    const previousTitle = $("tripTitle").value;

    state.itinerary = [...trip.destinationIds];
    state.activeTripId = trip.id;

    if (!persist("itinerary")) {
        state.itinerary = previous;
        state.activeTripId = previousActiveTripId;
        return;
    }

    $("tripTitle").value = trip.title;

    if (!writeStorage(storageKey("tripTitle"), trip.title)) {
        state.itinerary = previous;
        state.activeTripId = previousActiveTripId;
        $("tripTitle").value = previousTitle;
        persist("itinerary");
        return;
    }

    renderItinerary();
    renderPlannerDestinations();
    renderDestinations();
    updateModalItinerary();

    $("planner").scrollIntoView({
        behavior: "smooth"
    });

    showToast(`"${trip.title}" loaded into the planner.`);
}

/* ==========================================
   6.2 DELETE SAVED TRIP
   ========================================== */

/*
   When deleting a saved trip:

   1. Remove it from saved itineraries.
   2. If that trip is currently loaded, clear
      the current itinerary as well.
   3. Clear its trip name.
   4. Update localStorage.
   5. Refresh all affected sections.

   Other saved trips remain untouched.
*/

function deleteSavedTrip(id) {
    const trip = state.trips.find(item => item.id === id);

    if (!trip) {
        showToast("This saved trip could not be found.", true);
        return;
    }

    confirmAction({
        title: "Delete saved trip?",

        message:
            `"${trip.title}" will be removed from this device. ` +
            "If it is currently loaded in your planner, its itinerary will also be cleared.",

        okLabel: "Delete trip",

        onConfirm: () => {
            const previousTrips = [...state.trips];
            const previousItinerary = [...state.itinerary];
            const previousActiveTripId = state.activeTripId;
            const previousTitle = $("tripTitle").value;
            const previousStoredTitle = readStorage(storageKey("tripTitle"));

            const isLoadedTrip = state.activeTripId === id;

            // Remove the selected saved trip.
            state.trips = previousTrips.filter(
                item => item.id !== id
            );

            // Clear the planner only if this exact trip is loaded.
            if (isLoadedTrip) {
                state.itinerary = [];
                state.activeTripId = null;
                $("tripTitle").value = "";
            }

            // Save the updated trips.
            if (!persist("trips")) {
                state.trips = previousTrips;
                state.itinerary = previousItinerary;
                state.activeTripId = previousActiveTripId;
                $("tripTitle").value = previousTitle;
                return;
            }

            // Save the cleared itinerary if necessary.
            if (isLoadedTrip && !persist("itinerary")) {
                state.trips = previousTrips;
                state.itinerary = previousItinerary;
                state.activeTripId = previousActiveTripId;

                $("tripTitle").value = previousTitle;

                persist("trips");
                writeStorage(storageKey("itinerary"), previousItinerary);
                writeStorage(storageKey("tripTitle"), previousStoredTitle || "");

                return;
            }

            // Clear the stored trip title.
            if (isLoadedTrip) {
                removeStorage(storageKey("tripTitle"));
            }

            // Refresh all relevant sections.
            renderSavedTrips();
            renderItinerary();
            renderPlannerDestinations();
            renderDestinations();
            updateSummary();
            updateModalItinerary();

            showToast(
                isLoadedTrip
                    ? "Saved trip deleted and its itinerary cleared."
                    : "Saved trip deleted successfully."
            );
        }
    });
}

/* ==========================================
   7. MODALS, TOAST AND CONFIRM DIALOG
   ========================================== */

function getModal(id) {
    if (typeof bootstrap === "undefined") return null;

    return bootstrap.Modal.getOrCreateInstance($(id));
}

function showModal(id) {
    const modal = getModal(id);

    if (modal) modal.show();
}

function hideModal(id) {
    const modal = getModal(id);

    if (modal) modal.hide();
}

function openDestinationDetails(id) {
    const destination = findDestination(id);

    if (!destination) return;

    state.selectedId = id;

    const image = $("modalImage");

    image.removeAttribute("data-fallback");

    image.src = destination.image || artFor(destination.category);

    if (destination.image) {
        image.dataset.fallback = artFor(destination.category);
    }

    image.alt = destination.name;

    $("modalCategory").textContent = destination.category;

    $("modalLocation").innerHTML =
        `${icon("geo-alt-fill")} ${esc(destination.municipality)}, Marinduque`;

    $("modalTitle").textContent = destination.name;
    $("modalDescription").textContent = destination.description;
    $("modalBackground").textContent = destination.background;
    $("modalLocationDetail").textContent = formatLocation(destination);

    $("modalAccess").textContent =
        destination.access ||
        "Ask the local tourism office how to get there.";

    $("modalConfirm").textContent =
        destination.confirm ||
        "Visiting arrangements and conditions with the local tourism office.";

    const credit = $("modalCredit");

    credit.hidden = !destination.imageCredit;

    credit.textContent = destination.imageCredit
        ? `Photo: ${destination.imageCredit}`
        : "";

    $("modalHighlights").innerHTML =
        (destination.highlights || [])
            .map(item => `<li>${esc(item)}</li>`)
            .join("");

    updateModalFavorite();
    updateModalItinerary();

    showModal("destinationModal");
}

function updateModalFavorite() {
    if (state.selectedId === null) return;

    const isFavorite =
        state.favorites.includes(state.selectedId);

    const button = $("modalFavorite");

    button.setAttribute(
        "aria-pressed",
        String(isFavorite)
    );

    button.innerHTML = isFavorite
        ? `${icon("heart-fill")} Remove from favorites`
        : `${icon("heart")} Save to favorites`;
}

function updateModalItinerary() {
    if (state.selectedId === null) return;

    const added =
        state.itinerary.includes(state.selectedId);

    const button = $("modalAddItinerary");

    button.setAttribute(
        "aria-disabled",
        String(added)
    );

    button.innerHTML = added
        ? `${icon("check-lg")} In your itinerary`
        : `${icon("plus-lg")} Add to itinerary`;
}

function confirmAction({
    title,
    message,
    okLabel,
    onConfirm
}) {
    if (typeof bootstrap === "undefined") {
        onConfirm();
        return;
    }

    state.pendingConfirm = onConfirm;

    $("confirmTitle").textContent = title;
    $("confirmMessage").textContent = message;
    $("confirmOk").textContent = okLabel || "Confirm";

    showModal("confirmModal");
}

let toastInstance = null;

function showToast(message, isWarning = false) {
    const element = $("appToast");

    $("toastMessage").textContent = message;

    element.classList.toggle(
        "is-warning",
        isWarning
    );

    $("toastIcon").className =
        `bi ${isWarning
            ? "bi-exclamation-circle-fill"
            : "bi-check-circle-fill"
        }`;

    if (typeof bootstrap === "undefined") return;

    if (!toastInstance) {
        toastInstance = bootstrap.Toast.getOrCreateInstance(
            element,
            { delay: 3200 }
        );
    }

    toastInstance.show();
}

/* ==========================================
   8. EVENT WIRING
   ========================================== */

function setupNavigation() {
    const navbar = $("mainNavbar");

    const links = [
        ...document.querySelectorAll(".navbar-nav .nav-link")
    ];

    const menu = $("navbarMenu");

    const updateNavbar = () => {
        navbar.classList.toggle(
            "scrolled",
            window.scrollY > 30
        );
    };

    window.addEventListener(
        "scroll",
        updateNavbar,
        { passive: true }
    );

    updateNavbar();

    document.querySelectorAll(
        ".navbar-nav .nav-link"
    ).forEach(item => {
        item.addEventListener("click", () => {
            if (
                menu.classList.contains("show") &&
                typeof bootstrap !== "undefined"
            ) {
                bootstrap.Collapse
                    .getOrCreateInstance(menu)
                    .hide();
            }
        });
    });

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;

                    links.forEach(link => {
                        const active =
                            link.getAttribute("href") ===
                            `#${entry.target.id}`;

                        link.classList.toggle(
                            "active",
                            active
                        );

                        if (active) {
                            link.setAttribute(
                                "aria-current",
                                "true"
                            );
                        } else {
                            link.removeAttribute("aria-current");
                        }
                    });
                });
            },
            {
                rootMargin: "-40% 0px -55% 0px"
            }
        );

        links.forEach(link => {
            const section = document.querySelector(
                link.getAttribute("href")
            );

            if (section) observer.observe(section);
        });
    }
}

function handleAction(event) {
    const element = event.target.closest("[data-action]");

    if (!element || element.disabled) return;

    const action = element.dataset.action;
    const id = Number(element.dataset.id);

    switch (action) {
        case "toggle-favorite":
            toggleFavorite(id);

            refocus(
                `[data-action="toggle-favorite"][data-id="${id}"]`
            );
            break;

        case "remove-favorite":
            toggleFavorite(id);
            break;

        case "open-details":
            openDestinationDetails(id);
            break;

        case "add-itinerary":
            addToItinerary(id);

            refocus(
                `[data-action="open-details"][data-id="${id}"]`
            );
            break;

        case "remove-itinerary":
            removeFromItinerary(id);
            break;

        case "move-up":
        case "move-down": {
            moveItineraryItem(
                id,
                action === "move-up" ? -1 : 1
            );

            const opposite =
                action === "move-up"
                    ? "move-down"
                    : "move-up";

            refocus(
                `[data-action="${action}"][data-id="${id}"]:not(:disabled)`,
                `[data-action="${opposite}"][data-id="${id}"]`
            );

            break;
        }

        case "clear-itinerary":
            clearItinerary();
            break;

        case "save-trip":
            saveCurrentTrip();
            break;

        case "load-trip":
            loadSavedTrip(id);
            break;

        case "delete-trip":
            deleteSavedTrip(id);
            break;

        case "clear-search":
            state.search = "";
            $("searchInput").value = "";

            renderDestinations();

            $("searchInput").focus();
            break;

        case "reset-filters":
            resetFilters();
            break;

        default:
            break;
    }
}

/* Keep keyboard focus after a list re-renders. */

function refocus(primary, fallback) {
    const target =
        document.querySelector(primary) ||
        (fallback && document.querySelector(fallback));

    if (target) {
        target.focus({
            preventScroll: true
        });
    }
}

function setupEventListeners() {
    document.addEventListener(
        "click",
        handleAction
    );

    $("searchInput").addEventListener(
        "input",
        debounce(event => {
            state.search = event.target.value;
            renderDestinations();
        }, 150)
    );

    $("searchInput").addEventListener(
        "input",
        event => {
            $("clearSearch").hidden =
                event.target.value === "";
        }
    );

    $("municipalityFilter").addEventListener(
        "change",
        event => {
            state.municipality = event.target.value;
            renderDestinations();
        }
    );

    $("categoryFilter").addEventListener(
        "change",
        event => {
            setCategory(event.target.value);
        }
    );

    document.querySelectorAll(
        ".category-chip"
    ).forEach(chip => {
        chip.addEventListener("click", () => {
            setInterest(chip.dataset.interest);
        });
    });

    $("tripTitle").addEventListener(
        "input",
        debounce(event => {
            writeStorage(
                storageKey("tripTitle"),
                event.target.value
            );
        }, 300)
    );

    $("plannerSearch").addEventListener(
        "input",
        debounce(renderPlannerDestinations, 150)
    );

    $("modalFavorite").addEventListener(
        "click",
        () => {
            if (state.selectedId !== null) {
                toggleFavorite(state.selectedId);
            }
        }
    );

    $("modalAddItinerary").addEventListener(
        "click",
        () => {
            if (
                state.selectedId !== null &&
                !state.itinerary.includes(state.selectedId)
            ) {
                addToItinerary(state.selectedId);
            }
        }
    );

    $("confirmOk").addEventListener(
        "click",
        () => {
            const callback = state.pendingConfirm;

            state.pendingConfirm = null;

            hideModal("confirmModal");

            if (typeof callback === "function") {
                callback();
            }
        }
    );
}

/* ==========================================
   9. START-UP
   ========================================== */

async function loadData() {
    const grid = $("destinationGrid");

    try {
        const response = await fetch(DATA_URL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const destinations =
            Array.isArray(data)
                ? data
                : data.destinations;

        if (!Array.isArray(destinations)) {
            throw new Error(
                "destinations.json has no destinations list."
            );
        }

        state.destinations = destinations;

        state.dataLoaded = true;

    } catch (error) {
        console.error("Destination loading error:", error);

        grid.innerHTML = `
            <div class="saved-empty" role="alert">
                ${icon("exclamation-circle")}

                <strong>
                    Destination data could not be loaded.
                </strong><br>

                Open this project with VS Code Live Server
                (or any local web server) so the browser
                can read destinations.json, and check that
                the file is in the same folder as index.html.
            </div>
        `;
    }
}

async function init() {
    setupNavigation();

    setupEventListeners();

    await loadData();

    loadSavedData();

    renderAll();
}

document.addEventListener(
    "DOMContentLoaded",
    init
);
