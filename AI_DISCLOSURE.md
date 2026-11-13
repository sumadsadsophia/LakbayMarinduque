# AI DISCLOSURE LOG

## Project Information

**Project Title:** Lakbay Marinduque: A Web-Based Tourism and Cultural Discovery and Itinerary Planning System for Marinduque

**Group Name:** CRAMMERS

**Course / Section:** BSI/T -- 3D

**AI Tool Used:** ChatGPT

------------------------------------------------------------------------

## 1. AI Tools Used

| AI Tool | Purpose |
|---------|---------|
| ChatGPT | Assistance with project planning, feature identification, website development, code generation, UI/UX improvement, homepage layout refinement, and project documentation. |

------------------------------------------------------------------------

## 2. AI-Assisted Tasks and Prompts

### 2.1 Project Planning and Feature Identification

**Purpose:** To refine the project concept and identify the essential MVP features.

**Prompt Used:**

"**Role:** Act as a systems analyst and project development adviser. **Task:** Help us refine our project concept and identify and organize the essential core functional features of the system. **Context:** Our project, Lakbay Marinduque, is a web-based tourism and cultural discovery and itinerary planning system for Marinduque, aimed at giving tourists and visitors an accessible and organized platform for exploring the island's tourism and cultural attractions; the features should focus on helping users discover tourist destinations, view destination information, organize itineraries, and save their favorite destinations and trips. **Constraints:** Base the features on the project's objectives and target users, avoid suggesting unnecessary or complicated features that are outside the project's MVP scope, and keep every suggestion realistic for a student group to implement. **Expected Output:** A clear and practical list of core functional features, including a description of each feature and the expected user actions. **Acceptance Criteria:** The output is acceptable if it presents a manageable set of core features (four) that directly support the project's objectives, each feature has a clear description and defined user actions, and no feature falls outside the MVP scope or requires services beyond what the project can realistically implement."

**AI Assistance:**

- Refined the project concept and objectives.
- Helped identify and organize the four core functional features.
- Suggested practical functionality aligned with the project's MVP scope.

**Affected Section:**

- Project Concept
- Core Functional Features -- MVP

**Human Validation:** The group reviewed the suggested features and selected the four functions that best support the project's objectives.

------------------------------------------------------------------------

### 2.2 Website Development, Code Generation, and UI/UX Improvement

**Purpose:** To develop the website and improve its interface, responsiveness, and functionality.

**Prompt Used:**

"**Role:** Act as an experienced front-end web developer and UI/UX designer. **Task:** Develop and improve our existing Lakbay Marinduque website so that it implements our four selected core features: (1) a Tourism and Cultural Directory with destination searching and filtering, (2) Destination Details and Travel Information, (3) an Interactive Itinerary Planner with add, remove, and rearrange functions, and (4) Saved Trips and Destination Bookmarks using localStorage. **Context:** The project is a frontend-only tourism website intended to help tourists and visitors explore destinations in Marinduque and organize their trips, built with HTML5, CSS3, Bootstrap, Vanilla JavaScript, JSON, and browser localStorage, and it is meant to look suitable for an officially deployed tourism website. **Constraints:** Use only the agreed technologies, do not introduce unnecessary features, backend services, databases, or authentication systems outside the agreed project scope, and keep the interface professional, modern, organized, visually appealing, and responsive. **Expected Output:** Complete and coordinated source code for `index.html`, `style.css`, `script.js`, and `destinations.json`, with matching HTML elements, functional JavaScript interactions, organized destination data, and a responsive user interface. **Acceptance Criteria:** The output is acceptable if the four files work together without errors when run on a local development server, destination searching and filtering work, destination details display correctly, itinerary destinations can be added, removed, and rearranged, bookmarks and saved trips persist after a browser refresh, the layout is responsive across screen sizes, and no out-of-scope features have been added."

**AI Assistance:**

- Generated and improved the website's frontend code.
- Helped implement the four core functional features.
- Organized destination information using JSON.
- Improved the website's layout, navigation, styling, and responsiveness.
- Assisted in connecting the HTML, CSS, and JavaScript files.

**Affected Files:**

- `index.html`
- `style.css`
- `script.js`
- `destinations.json`

**Human Validation:** The group reviews the generated code, runs the website using a local development server, tests the four core features, and corrects any errors found.

------------------------------------------------------------------------

### 2.3 Homepage Layout and Visual Composition Refinement

**Purpose:** To further improve the homepage's visual hierarchy, hero image presentation, content width, spacing, and responsive layout based on the website screenshots and the desired visual reference.

**Prompt Used:**

"**Role:** Act as a senior front-end developer and UI/UX designer. **Task:** Review the existing Lakbay Marinduque website and the provided screenshots, focusing on the homepage hero section, and refine the design so the hero photograph fills the available screen area more effectively, the main content container is wider, and the navigation, hero text, call-to-action, and feature highlights follow a consistent wider layout with improved headline size, text width, spacing, contrast, image positioning, and overlay. **Context:** The current homepage has too much unused space on the left and right sides, and the hero image does not create the wide, immersive visual composition we want; a reference image is supplied as inspiration for the overall composition, but the site must keep Lakbay Marinduque's own identity, colors, content, and existing design style. **Constraints:** Keep important destination scenery visible and avoid unnecessary cropping where possible, make the layout responsive across desktop, tablet, and mobile screens, preserve the existing HTML structure and all working functionality (destination browsing, search and filters, destination details, itinerary planning, bookmarks, and saved trips), do not add backend services, authentication, databases, or unrelated features, and prefer focused CSS changes, modifying other files only when necessary. **Expected Output:** The complete updated files, with `style.css` as the primary changed file, together with an explanation of how to replace the files without removing the existing `images` folder or `destinations.json`. **Acceptance Criteria:** The output is acceptable if the hero image fills the screen area with a balanced, non-stretched composition and a clear visual hierarchy, the content is aligned in a consistent wider container, the layout displays correctly at desktop, tablet, and mobile widths, navigation and all four core features still work as before, and the existing `images` folder and `destinations.json` remain intact."

**AI Assistance:**

- Reviewed the homepage screenshots and identified issues with excessive side spacing and the hero section's visual composition.
- Refined the hero section to use more of the available screen width and height.
- Adjusted the hero image positioning, overlay, and text composition to create a more immersive presentation.
- Improved the scale and spacing of the headline, description, call-to-action button, and homepage feature highlights.
- Adjusted the layout for desktop, tablet, and mobile screen sizes.
- Focused the refinement on the existing design and CSS while retaining the website's established content and functionality.

**Affected Files:**

- `style.css` -- primary file for the homepage layout, image presentation, spacing, typography, and responsive adjustments.
- `index.html` and `script.js` -- retained in the updated project package to keep the project files coordinated; no new application functionality was intended by this visual refinement.

**Human Validation:** The group should replace the relevant project files, run the website using a local development server, and compare the homepage at desktop, tablet, and mobile widths. The group should also verify that the hero image displays correctly and that navigation and the four core features continue to work as expected.

------------------------------------------------------------------------

### 2.4 Project Documentation and Refinement

**Purpose:** To prepare and refine the project's academic documentation.

**Prompt Used:**

"**Role:** Act as an academic writing assistant and project documentation adviser. **Task:** Help us prepare and refine the Week 2 MVP Partial Documentation for Lakbay Marinduque based on the provided activity template, covering our project's identified problem, proposed solution, four core functional features, technology plan and justification, current demonstration, limitations, partial manuscript, references, and AI disclosure progress. **Context:** The project is a web-based tourism and cultural discovery and itinerary planning system for Marinduque, developed using HTML5, CSS3, Bootstrap, Vanilla JavaScript, JSON, and localStorage, and the documentation is an academic requirement that must reflect the project's actual scope and development progress. **Constraints:** Use clear, concise, formal, and appropriate academic language, follow the provided template, do not invent references, do not claim untested features are fully implemented, and do not include functionality that is not part of the project. **Expected Output:** A well-organized and refined documentation draft that follows the provided template and accurately represents the project's current status. **Acceptance Criteria:** The output is acceptable if every section required by the template is present, the writing is formal and consistent, all described features and technologies match what the project actually uses and has implemented, limitations are stated honestly, and every reference can be verified as real."

**AI Assistance:**

- Organized and refined the documentation sections.
- Improved the descriptions of the identified problem and proposed solution.
- Helped explain the four core functional features.
- Assisted with the technology plan and project limitations.
- Helped prepare the AI disclosure section.

**Affected Document:**

- Week 2 MVP Partial Documentation

**Human Validation:** The group reviews and edits the documentation to ensure that the information accurately represents the project and its current development progress.

------------------------------------------------------------------------

## 3. AI Output Validation and Testing

AI-assisted code, suggestions, and generated content are reviewed by the group before being included in the project.

The validation process includes:

1.  Reviewing the generated HTML, CSS, JavaScript, and JSON files.
2.  Running the website using a local development server.
3.  Testing destination searching and filtering.
4.  Checking whether destination details display correctly.
5.  Testing the addition, removal, and rearrangement of itinerary destinations.
6.  Testing destination bookmarks and saved trips.
7.  Checking whether saved information remains available after refreshing the browser.
8.  Verifying destination descriptions, travel information, and photographs using reliable sources.
9.  Checking the homepage layout and image display at different screen sizes.
10. Correcting errors and making necessary improvements.

------------------------------------------------------------------------

## 4. Human Contributions

The group is responsible for planning the project, selecting the core functional features, reviewing and editing AI-assisted code, organizing destination information, verifying content accuracy, conducting functionality tests, and making final development decisions.

AI-generated suggestions and code serve only as assistance. The group remains responsible for understanding, reviewing, modifying, and validating the final website and its documentation.

------------------------------------------------------------------------

## 5. Disclosure Statement

ChatGPT was used as an AI assistance tool during the planning, development, design improvement, coding, and documentation of Lakbay Marinduque. AI-assisted outputs were reviewed and are subject to editing, testing, and verification by the group before being included in the project.