$(document).ready(function () {
    // define vars
    let yearChart = null;
    let hostsyearChart = null;
    let eventsCategoryChart = null;
    let eventsNameChart = null;
    let miradorViewer = null;
    let eventsData = null;
    let mapData = null;
    let graphsData = null;
    let bigMap = null;
    let singleMap = null;
    let singleMarker = null;
    let namesList = null;
    initiateStartup();
    window.onpopstate = function () {
        $('#data-search input').typeahead('destroy');
        initiateStartup();
    }
    function initiateStartup() {
        let queryParams = new URLSearchParams(window.location.search);
        listEvents(queryParams);
        initializeTypeahead();
        $("#data-search").submit(function (event) {
            event.preventDefault();
            $(this).find('input').blur();
            $(this).find('button').blur();
            let text = $(this).find('input').val();
            // Update URL Query.
            let queryParams = new URLSearchParams();
            queryParams.set("text", text);
            history.pushState(null, null, "?" + queryParams.toString());
            listEvents(queryParams);
        });
    }

    function listEvents(queryParams) {
        if (yearChart) {
            yearChart.destroy();
            yearChart = null;
        }
        if (hostsyearChart) {
            hostsyearChart.destroy();
            hostsyearChart = null;
        }
        if (eventsCategoryChart) {
            eventsCategoryChart.destroy();
            eventsCategoryChart = null;
        }
        if (eventsNameChart) {
            eventsNameChart.destroy();
            eventsNameChart = null;
        }
        if (miradorViewer) {
            miradorViewer.unmount();
            miradorViewer = null;
        }
        if (eventsData) {
            eventsData = null;
        }
        if (mapData) {
            mapData = null;
        }
        if (graphsData) {
            graphsData = null;
        }
        if (singleMap) {
            singleMap.remove();
            singleMap = null;
        }
        if (bigMap) {
            bigMap.remove();
            bigMap = null;
        }
        if (singleMarker) {
            singleMarker = null;
        }
        if (namesList) {
            namesList = null;
        }
        $('.pagination-row').remove();
        $('.page-load-status').remove();
        $('.modal').modal('hide');
        $('.modal').modal('dispose');
        $('.offcanvas').offcanvas('dispose');
        $('#data-container').empty();
        $('#data-container').html(`
        <div id="loader" class="d-flex justify-content-center align-items-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Fetching data...</span>
            </div>
        </div>
        `);
        $('#facet-container').empty();
        $('#modal-container').empty();
        $('#results').text("Fetching data...");
        $('#query').empty().hide();
        $('#facet').empty().hide();
        $('#graph').empty().hide();
        $('#map').empty().hide();
        $('#data-search input').val("");
        let text = "";
        let names = "";
        let categories = "";
        let issue = "";
        let location = "";
        let year = "";
        let year_month = "";
        let date_range_start = "";
        let date_range_end = "";
        let titles = "";
        let page = "";
        if (queryParams.toString()) {
            if (queryParams.has('text')) {
                text = queryParams.get('text');
                if (text) {
                    let newQueryParams = new URLSearchParams(window.location.search);
                    newQueryParams.delete('text')
                    $('#query').append(`
                    <li class="list-inline-item">
                        <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${text}</a>
                    </li>
                    `);
                }

            }
            if (queryParams.has('names[]')) {
                names = queryParams.getAll('names[]');
                names.forEach(name => {
                    let newQueryParams = new URLSearchParams();
                    queryParams.forEach((value, key) => {
                        if (!((key == "names[]") && (value == name))) {
                            newQueryParams.append(key, value);
                        }
                    });
                    $('#query').append(`
                    <li class="list-inline-item">
                        <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${name}</a>
                    </li>
                    `);
                });
            }
            if (queryParams.has('categories[]')) {
                categories = queryParams.getAll('categories[]');
                categories.forEach(category => {
                    let newQueryParams = new URLSearchParams();
                    queryParams.forEach((value, key) => {
                        if (!((key == "categories[]") && (value == category))) {
                            newQueryParams.append(key, value);
                        }
                    });
                    $('#query').append(`
                    <li class="list-inline-item">
                        <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${category}</a>
                    </li>
                    `);
                });
            }
            if (queryParams.has('issue[]')) {
                issue = queryParams.getAll('issue[]');
                issue.forEach(this_issue => {
                    let newQueryParams = new URLSearchParams();
                    queryParams.forEach((value, key) => {
                        if (!((key == "issue[]") && (value == this_issue))) {
                            newQueryParams.append(key, value);
                        }
                    });
                    $('#query').append(`
                    <li class="list-inline-item">
                        <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${this_issue}</a>
                    </li>
                    `);
                });
            }
            if (queryParams.has('date_range_start') && queryParams.has('date_range_end')) {
                date_range_start = queryParams.get('date_range_start');
                date_range_end = queryParams.get('date_range_end');
                let newQueryParams = new URLSearchParams(window.location.search);
                newQueryParams.delete('date_range_start');
                newQueryParams.delete('date_range_end');
                $('#query').append(`
                <li class="list-inline-item">
                    <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${date_range_start}-${date_range_end}</a>
                </li>
                `);
            }
            if (queryParams.has('titles')) {
                titles = queryParams.get('titles');
                let newQueryParams = new URLSearchParams(window.location.search);
                newQueryParams.delete('titles');
                $('#query').append(`
                <li class="list-inline-item">
                    <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${titles}</a>
                </li>
                `);
            }
            if (queryParams.has('year')) {
                year = queryParams.get('year');
                let newQueryParams = new URLSearchParams(window.location.search);
                newQueryParams.delete('year');
                $('#query').append(`
                <li class="list-inline-item">
                    <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${year}</a>
                </li>
                `);
            }
            if (queryParams.has('year_month')) {
                year_month = queryParams.get('year_month');
                let newQueryParams = new URLSearchParams(window.location.search);
                newQueryParams.delete('year_month');
                $('#query').append(`
                <li class="list-inline-item">
                    <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${year_month}</a>
                </li>
                `);
            }
            if (queryParams.has('location')) {
                location = queryParams.get('location');
                let newQueryParams = new URLSearchParams(window.location.search);
                newQueryParams.delete('location');
                $('#query').append(`
                <li class="list-inline-item">
                    <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${location}</a>
                </li>
                `);
            }
            if (queryParams.has('page')) {
                page = queryParams.get('page');
                let newQueryParams = new URLSearchParams(window.location.search);
                newQueryParams.delete('page');
                $('#query').append(`
                <li class="list-inline-item">
                    <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> Page ${page}</a>
                </li>
                `);
            }
        }
        const url = "/data-api/events?" + queryParams.toString();
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                eventsData = data;
                data = null;
                const totalResults = eventsData[0].count;
                let resultsText = ""
                if (totalResults > 1) {
                    resultsText = `Showing ${Number(totalResults).toLocaleString()} events`;
                } else if (totalResults == 1) {
                    resultsText = `Showing ${totalResults} event`;
                } else {
                    resultsText = `Your search did not return any events. Please try again with another search term.`;
                }
                namesList = [];
                $('#data-container').empty().hide();
                eventsData[0].results.forEach(event => {
                    $('#data-container').append(createListing(event));
                    event.names.forEach(name => {
                        if (!(namesList.includes(name._id))) {
                            namesList.push(name._id);
                            $('#modal-container').append(createNameModal(name));
                        }
                    });
                });
                createFacets();
                createGraphs(url);
                createMap();
                $('#results').hide().text(resultsText).fadeIn();
                $('#query').fadeIn();
                $('#data-container').fadeIn();
                $('#facet').fadeIn();
                $('#graph').fadeIn();
                $('#map').fadeIn();
                $('#modal-container').append(createViewerModal());
                $('#modal-container').append(createSingleMapModal());
                attachClicks();
                initiateViewer();
                initiateSingleMap();
                initiateScroll();
            })
            .catch((error) => {
                console.log(error);
                $('#data-container').append(`
                <div>
                <h2>Error</h2>
                <p class="lead">
                
                </p>
                </div>
                `);
            });
    }
    function createListing(event) {
        let start_date = '';
        if (event.start_date) {
            start_date = `
            <dt>Year-Month</dt>
            <dd>
            <span>${event.start_date}</span>
            <a href="?year_month=${encodeURIComponent(event.start_date.substring(0, 7))}" class="year-month-search link-dark ms-1 text-decoration-none" data-year-month="${encodeURIComponent(event.start_date.substring(0, 7))}" aria-label="Search for this year and month">
                <i class="fas fa-search" aria-hidden="true" title="Search for this year and month">
                </i>
            </a>
            </dd>
            `;
        }
        let namesHtml = '';
        if (event.names) {
            namesHtml = '<dt>Names</dt>';
            event.names.forEach(name => {
                namesHtml += `
                <dd>
                <span>${name.label}</span>
                <a href="?names[]=${encodeURIComponent(name.label)}" class="name-search link-dark ms-1 text-decoration-none" data-id="${name._id}" data-label="${encodeURIComponent(name.label)}" aria-label="Search for this name">
                    <i class="fas fa-search" aria-hidden="true" title="Search for this name">
                    </i>
                </a>
                <button class="name-info border-0 bg-transparent p-0 ms-1" data-bs-toggle="modal" data-bs-target="#nameInfo-${name._id}" aria-label="Name information">
                    <i class="fas fa-info-circle" aria-hidden="true" title="Name information">
                    </i>
                </button>
                </dd>
                `;
            });
        }
        let coordinates = '';
        if (event.location && event.location.coordinates) {
            coordinates = `
            <dt>Coordinates</dt>
            <dd>
            <span>${event.location.coordinates.join(", ")}</span>
            <a href="?location=${encodeURIComponent(event.location.coordinates)}" class="location-search link-dark ms-1 text-decoration-none" data-location="${encodeURIComponent(event.location.coordinates)}" aria-label="Search for this location">
                <i class="fas fa-search" aria-hidden="true" title="Search for this location">
                </i>
            </a>
            <button class="location-map border-0 bg-transparent p-0 ms-1" data-bs-toggle="modal" data-bs-target="#singleMapModal" data-longitude="${event.location.coordinates[0]}" data-latitude="${event.location.coordinates[1]}" data-formattedAddress="${encodeURIComponent(event.formatted_address)}" aria-label="See this location on a map">
                <i class="fas fa-map-marker-alt" aria-hidden="true" title="See this location on a map">
                </i>
            </button>
            </dd>
            `;
        }
        let appearsInList = [];
        event.appears_in.forEach(issue => {
            const date = new Date(issue.calendar_date);
            const options = {
                year: 'numeric',
                month: 'long',
                timeZone: 'UTC'
            };
            if (issue.calendar_date.length == 10) {
                options["day"] = 'numeric';
            }
            const displayTitle = `${issue.calendar_title}, ${date.toLocaleDateString('en-US', options)}`;
            let issueHtml = `
                <span>${displayTitle} (page ${issue.calendar_page})</span>
                <a href="?issue[]=${encodeURIComponent(issue.calendar_id)}" class="issue-search link-dark ms-1 text-decoration-none" data-calendar_id="${encodeURIComponent(issue.calendar_id)}" data-calendar_page="${encodeURIComponent(issue.calendar_page)}" aria-label="Search for this issue">
                <i class="fas fa-search" aria-hidden="true" title="Search for this issue">
                </i>
                </a>
                <button class="page-view border-0 bg-transparent p-0 ms-1" data-bs-toggle="modal" data-bs-target="#viewerModal" data-calendar_id="${encodeURIComponent(issue.calendar_id)}" data-calendar_page="${encodeURIComponent(issue.calendar_page)}" data-displayTitle="${encodeURIComponent(displayTitle)}" aria-label="See this page">
                <i class="fas fa-file" aria-hidden="true" title="See this page">
                </i>
                </button>
            `;
            appearsInList.push(issueHtml);
        });
        let eventHtml = `
        <div class="row py-4">
            <div class="col-md-3">
                <dl>
                    <dt>Date</dt>
                    <dd class="source">${event.when ? event.when : '""'}</dd>
                    ${start_date}
                </dl>
            </div>
            <div class="col-md-3">
                <dl>
                    <dt>What's Going On</dt>
                    <dd class="source">${event.what ? event.what : '""'}</dd>
                </dl>
            </div>
            <div class="col-md-3">
                <dl>
                    <dt>Given By</dt>
                    <dd class="source">${event.who ? event.who : '""'}</dd>
                    ${namesHtml}
                </dl>
            </div>
            <div class="col-md-3">
                <dl>
                    <dt>Where</dt>
                    <dd class="source">${event.where ? event.where : '""'}</dd>
                    ${coordinates}
                </dl>
            </div>
            <div class="col-12">
                <dl>
                    <dt>Description</dt>
                    <dd class="source">${event.description ? event.description : '""'}</dd>
                </dl>
            </div>
            <div class="col-12">
                <dl>
                    <dt>Issue</dt>
                    <dd>${appearsInList.join("<dd></dd>")}</dd>
                </dl>
            </div>
        </div>
        `;
        return eventHtml;
    }
    function attachClicks() {
        $(".name-search").off("click.fashionCalendar");
        $(".issue-search").off("click.fashionCalendar");
        $(".category-search").off("click.fashionCalendar");
        $(".location-search").off("click.fashionCalendar");
        $(".year-month-search").off("click.fashionCalendar");
        $(".remove-query").off("click.fashionCalendar");
        // Attach listeners to new content
        $(".name-search").on("click.fashionCalendar", function (event) {
            event.preventDefault();
            let names = decodeURIComponent($(this).data("label"));
            // Update URL Query.
            let queryParams = new URLSearchParams();
            queryParams.set("names[]", names);
            history.pushState(null, null, "?" + queryParams.toString());
            listEvents(queryParams);
        });
        $(".issue-search").on("click.fashionCalendar", function (event) {
            event.preventDefault();
            let issue = decodeURIComponent($(this).data("calendar_id"));
            // Update URL Query.
            let queryParams = new URLSearchParams();
            queryParams.set("issue[]", issue);
            history.pushState(null, null, "?" + queryParams.toString());
            listEvents(queryParams);
        });
        $(".category-search").on("click.fashionCalendar", function (event) {
            event.preventDefault();

            let category = decodeURIComponent($(this).data("label"));
            // Update URL Query.
            let queryParams = new URLSearchParams();
            queryParams.set("categories[]", category);
            history.pushState(null, null, "?" + queryParams.toString());
            let thisModal = $(event.target).parents('.name-modal');
            thisModal.modal('hide');
            thisModal[0].addEventListener('hidden.bs.modal', event => {
                listEvents(queryParams);
            })
        });
        $(".location-search").on("click.fashionCalendar", function (event) {
            event.preventDefault();
            let location = decodeURIComponent($(this).data("location"));
            // Update URL Query.
            let queryParams = new URLSearchParams();
            queryParams.set("location", location);
            history.pushState(null, null, "?" + queryParams.toString());
            listEvents(queryParams);
        });
        $(".year-month-search").on("click.fashionCalendar", function (event) {
            event.preventDefault();
            let year_month = decodeURIComponent($(this).data("year-month"));
            // Update URL Query.
            let queryParams = new URLSearchParams();
            queryParams.set("year_month", year_month);
            history.pushState(null, null, "?" + queryParams.toString());
            listEvents(queryParams);
        });
        $('.remove-query').on("click.fashionCalendar", function (event) {
            event.preventDefault();
            // Update URL Query.
            let queryParams = new URLSearchParams($(this).attr('href'));
            history.pushState(null, null, $(this).attr('href'));
            listEvents(queryParams);
        });
    }
    function createNameModal(name) {
        let nameModal = $(`
        <!-- Modal -->
        <div class="modal fade name-modal" id="nameInfo-${name._id}" tabindex="-1" aria-labelledby="nameInfo-${name._id}Label" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title fs-5" id="nameInfo-${name._id}Label">${name.label}</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
              </div>
            </div>
          </div>
        </div>
        `);
        const modalBody = $(nameModal).find('.modal-body');
        if (name.description) {
            modalBody.append(`
            <dl>
            <dt>Description</dt>
            <dd>${name.description}</dd>
            </dl>
            `);
        }
        if (name.categories.length) {
            let categoryList = $(`
            <dl><dt>Categories</dt></dl>
            `);
            name.categories.forEach(category => {
                categoryList.append(`
                <dd>
                <span>${category.label}</span>
                <a href="?categories[]=${encodeURIComponent(category.label)}" class="category-search link-dark ms-1 text-decoration-none" data-modal="#nameInfo-${name._id}" data-id="${category._id}" data-label="${encodeURIComponent(category.label)}" aria-label="Search for this category">
                    <i class="fas fa-search" aria-hidden="true" title="Search for this category">
                    </i>
                </a>
                </dd>
                `);
            });
            modalBody.append(categoryList);
        }
        if (name["wikipedia-link"] || name["research-sources"]) {
            let wikilink = "";
            let otherlinks = "";
            if (name["wikipedia-link"]) {
                wikilink = `
                <dd><a href="${name["wikipedia-link"]}" class="link-dark text-decoration-none" target="_blank">Wikipedia entry<i class="fas fa-external-link-alt ms-2"></i></a></dd>
                `;
            }
            if (name["research-sources"]) {
                wikilink = `
                <dd>${name["research-sources"]}</dd>
                `;
            }
            modalBody.append(`
            <dl>
            <dt>Sources</dt>
            ${wikilink}
            ${otherlinks}
            </dl>
            `);
        }

        //Add note to empty body
        if (!$.trim($(modalBody).html())) {
            modalBody.append("Unfortunately, it doesn't seem that we've been able to gather any information or categorize this name so far.")
        }

        return nameModal;
    }
    // Page viewer
    function createViewerModal() {
        let viewerModal = `
        <!-- Modal -->
        <div class="modal fade" id="viewerModal" tabindex="-1" aria-labelledby="viewerLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title fs-6" id="viewerLabel"></h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
              <div id="mirador-viewer-frame"></div>
              </div>
            </div>
          </div>
        </div>
        `;
        return viewerModal;
    }
    function initiateViewer() {
        const viewerModal = document.getElementById('viewerModal')
        if (viewerModal) {
            viewerModal.addEventListener('show.bs.modal', event => {
                if (miradorViewer) {
                    //Set current window to null temporarily
                    miradorViewer.store.dispatch(Mirador.actions.removeWindow('this-window-id'));
                };
            });
            viewerModal.addEventListener('shown.bs.modal', event => {
                const button = event.relatedTarget;
                const calendar_id = decodeURIComponent(button.getAttribute('data-calendar_id'));
                const calendar_page = decodeURIComponent(button.getAttribute('data-calendar_page'));
                const calendar_title = decodeURIComponent(button.getAttribute('data-displayTitle'));
                const pageURL = `/data-api/page?id=${encodeURIComponent(calendar_id)}&page=${encodeURIComponent(calendar_page)}`;
                const modalTitle = viewerModal.querySelector('.modal-title');
                const modalBody = viewerModal.querySelector('.modal-body');
                $(modalTitle).html(`
                <span>Page ${calendar_page}</span>
                <a class="btn btn-link link-dark ms-1 text-decoration-none p-0 disabled" aria-disabled="true" aria-label="View issue page"><i class="fas fa-book" aria-hidden="true" title="View issue page"></i></a>
                `);
                if (!miradorViewer) {
                    $(modalBody).html(`
                    <div id="mirador-viewer-frame">
                        <div id="mirador-viewer"></div>
                    </div>
                    `);
                    miradorViewer = Mirador.viewer(
                        {
                            id: "mirador-viewer",
                            workspaceControlPanel: {
                                enabled: false
                            },
                            window: {
                                allowClose: false,
                                allowFullscreen: true,
                                allowMaximize: false,
                            },
                            translations: {
                                en: {
                                    welcome: 'Fetching data...',
                                }
                            }
                        }
                    );
                }
                fetch(pageURL)
                    .then((response) => response.json())
                    .then((pageData) => {
                        let miradorData = $(pageData.html).children('#mirador-viewer');
                        $(modalTitle).find('a').attr({ "href": pageData["item-link"], "aria-disabled": "false" }).removeClass("disabled");
                        const manifest = miradorData.data('manifest');
                        const authorization = miradorData.data('authorization');
                        const canvas = miradorData.data('canvas');
                        const thisWindow = {
                            id: 'this-window-id',
                            manifestId: manifest,
                            thumbnailNavigationPosition: 'far-right',
                            canvasId: canvas
                        }
                        const miradorConfig = {};
                        if (authorization) {
                            const miradorConfig = {};
                            miradorConfig['requests'] = {
                                preprocessors: [
                                    (url, options) => (url.match('info.json') && { ...options, headers: { ...options.headers, "Authorization": "Bearer " + authorization } }),
                                ]
                            };
                            miradorConfig['osdConfig'] = {
                                loadTilesWithAjax: true,
                                ajaxHeaders: {
                                    'Authorization': `Bearer ${authorization}`
                                }
                            }
                            miradorViewer.store.dispatch(Mirador.actions.updateConfig(miradorConfig));
                        }
                        miradorViewer.store.dispatch(Mirador.actions.addWindow(thisWindow));
                        pageData = null;
                    })
                    .catch((error) => {
                        console.log(error);
                        console.log(`Error retrieving ${calendar_id}, page ${calendar_page}`);
                        modalBody.textContent = `Error retrieving ${calendar_id}, page ${calendar_page}`;
                    });
            })
        }
    }
    // Maps
    function createMap() {
        $('#modal-container').append(`
        <!-- Modal -->
        <div class="modal fade" id="mapModal" tabindex="-1" aria-labelledby="mapLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-fullscreen">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title fs-5" id="mapLabel">Map</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
              <div id="big-map"></div>
              </div>
            </div>
          </div>
        </div>
        `);
        $('#map').html(`
        <button id="map-button" class="btn btn-fit-blue floating-action" type="button" data-bs-toggle="modal"
            data-bs-target="#mapModal" aria-controls="mapModal" aria-label="Map results">
            <span class="action-container">
            <i class="fas fa-map" aria-hidden="true" title="Map results">
            </i>
            Map
            </span>
        </button>
        `);
        const mapModal = document.getElementById('mapModal');
        if (mapModal) {
            $("#big-map").html(`
            <div id="map-loader" class="d-flex justify-content-center align-items-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Fetching data...</span>
                </div>
            </div>
            `);
            mapModal.addEventListener('shown.bs.modal', async event => {
                if (!mapData) {
                    let queryParams = new URLSearchParams(window.location.search);
                    queryParams.set('map', 'true');
                    const url = "/data-api/events?" + queryParams.toString();
                    try {
                        const res = await fetch(url);
                        mapData = await res.json();
                    } catch (error) {
                        console.log('There was an error', error);
                        $("#big-map").text("Sorry. There was an error fetching the data.");
                        return;
                    }
                }
                $("#big-map").empty();
                bigMap = L.map('big-map');
                L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZml0ZGlnaXRhbGluaXRpYXRpdmVzIiwiYSI6ImNqZ3FxaWI0YTBoOXYyenA2ZnVyYWdsenQifQ.ckTVKSAZ8ZWPAefkd7SOaA', {
                    id: 'mapbox/light-v10',
                    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>'
                }).addTo(bigMap);
                let featureGroup = L.featureGroup();
                mapData[0].results.forEach(event => {
                    if (event.location && ('coordinates' in event.location) && event.location.coordinates[0] && event.location.coordinates[1]) {
                        let marker = L.marker([event.location.coordinates[1], event.location.coordinates[0]]);
                        let popup_content = '';
                        if (event.what) {
                            popup_content += `<h1 class="source">${event.what}`;
                            if (event.who) {
                                popup_content += `<br><small class="text-muted">${event.who}</small>`;
                            }
                            popup_content += `</h1>`;
                        }
                        if (event.where || event.start_date || event.when) {
                            popup_content += `<ul class="list-unstyled source">`;

                            if (event.when) {
                                popup_content += `<li>${event.when}</li>`;
                            }
                            if (event.start_date) {
                                popup_content += `<li>${event.start_date.substring(0, 4)}</li>`;
                            }
                            if (event.where) {
                                popup_content += `<li>${event.where}</li>`;
                            }
                            popup_content += '</ul>';
                        }
                        if (event.description) {
                            popup_content += `<p class="source">${event.description}</p>`;
                        }
                        popup_content += '<dl>';
                        if (event.appears_in) {
                            popup_content += '<dt>Appears in</dt>';
                            event.appears_in.forEach(issue => {
                                const date = new Date(issue.calendar_date);
                                const options = {
                                    year: 'numeric',
                                    month: 'long',
                                    timeZone: 'UTC'
                                };
                                if (issue.calendar_date.length == 10) {
                                    options["day"] = 'numeric';
                                }
                                const displayTitle = `${issue.calendar_title}, ${date.toLocaleDateString('en-US', options)}`;
                                popup_content += `
                                    <dd>
                                    <span>${displayTitle} (page ${issue.calendar_page})</span>
                                    <a href="?issue[]=${encodeURIComponent(issue.calendar_id)}" class="issue-search link-dark ms-1 text-decoration-none" data-calendar_id="${encodeURIComponent(issue.calendar_id)}" data-calendar_page="${encodeURIComponent(issue.calendar_page)}" aria-label="Search for this issue">
                                    <i class="fas fa-search" aria-hidden="true" title="Search for this issue">
                                    </i>
                                    </a>
                                    <button class="page-view border-0 bg-transparent p-0 ms-1" data-bs-toggle="modal" data-bs-target="#viewerModal" data-calendar_id="${encodeURIComponent(issue.calendar_id)}" data-calendar_page="${encodeURIComponent(issue.calendar_page)}" data-displayTitle="${encodeURIComponent(displayTitle)}" aria-label="See this page">
                                    <i class="fas fa-file" aria-hidden="true" title="See this page">
                                    </i>
                                    </button>
                                    </dd>
                                `;
                            });
                        }
                        if (event.associated_names) {
                            popup_content += '<dt>Names</dt>';
                            $.each(event.associated_names, function (index, value) {
                                popup_content += '<dd>' + value + '</dd>';
                            });
                        }
                        popup_content += '</dl>';
                        let popup = L.popup({
                            maxWidth: 500
                        }).setContent(popup_content);
                        marker.bindPopup(popup);
                        featureGroup.addLayer(marker);
                    }
                });
                L.markerClusterGroup.layerSupport({
                    maxClusterRadius: 5
                }).addTo(bigMap).checkIn(featureGroup);
                bigMap.fitBounds(featureGroup.getBounds());
                featureGroup.addTo(bigMap);
            });
            mapModal.addEventListener('hide.bs.modal', event => {
                if (bigMap) {
                    bigMap.remove();
                    bigMap = null;
                    $("#big-map").empty();
                }
            });
        }

    }
    function createSingleMapModal() {
        let singleMapModal = `
        <!-- Modal -->
        <div class="modal fade" id="singleMapModal" tabindex="-1" aria-labelledby="singleMapLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title fs-5" id="singleMapLabel">Location</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
              <div id="single-map"></div>
              </div>
            </div>
          </div>
        </div>
        `;
        return singleMapModal;
    }
    function initiateSingleMap() {
        const singleMapModal = document.getElementById('singleMapModal');
        if (singleMapModal) {
            singleMapModal.addEventListener('show.bs.modal', event => {
                const button = event.relatedTarget;
                const longitude = button.getAttribute('data-longitude');
                const latitude = button.getAttribute('data-latitude');
                if (singleMap) {
                    singleMap.setView([latitude, longitude], 12);
                    if (singleMarker) {
                        singleMap.removeLayer(singleMarker);
                    }
                }
            });
            singleMapModal.addEventListener('shown.bs.modal', event => {
                const button = event.relatedTarget;
                const longitude = button.getAttribute('data-longitude');
                const latitude = button.getAttribute('data-latitude');
                const formattedAddress = decodeURIComponent(button.getAttribute('data-formattedAddress'));
                if (!singleMap) {
                    singleMap = L.map('single-map').setView([latitude, longitude], 12);
                    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZml0ZGlnaXRhbGluaXRpYXRpdmVzIiwiYSI6ImNqZ3FxaWI0YTBoOXYyenA2ZnVyYWdsenQifQ.ckTVKSAZ8ZWPAefkd7SOaA', {
                        id: 'mapbox/light-v10',
                        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>'
                    }).addTo(singleMap);
                }
                singleMarker = L.marker([latitude, longitude]);
                singleMap.addLayer(singleMarker);
                singleMarker.bindPopup(formattedAddress).openPopup();
            });
        }
    }

    function createFacets() {
        let hasFacets = false;
        let offCanvas = $(`
        <div class="offcanvas offcanvas-start shadow border-end-0" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="facets" aria-labelledby="facetsLabel">
            <div class="offcanvas-header border-bottom">
            <h3 class="offcanvas-title" id="facetsLabel">
                Facets
            </h3>
            <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body p-0 pb-4">
            </div>
        </div>
        `);
        let card = $(`
        <div class="card rounded-0 border-start-0 border-end-0">
            <h4 class="card-header"></h4>
            <ul class="list-group list-group-flush">
            </ul>
        </div>
        `);
        if (eventsData[0].facets.years.length > 1) {
            hasFacets = true;
            const first_year = eventsData[0].facets.years[0].year;
            const last_year = eventsData[0].facets.years[eventsData[0].facets.years.length - 1].year;
            let dateRangeCard = $(`
            <div class="card rounded-0 border-start-0 border-end-0">
                <h4 class="card-header">Date</h4>
                <form id="dateRangeFacet" class="card-body py-2">
                    <div class="row justify-content-between mb-4">
                    <div class="col-auto">
                        <label for="dateRangeMin" class="form-label">Min</label>
                        <input type="number" class="form-control form-control-sm" id="dateRangeMin" name="date_range_start" min="${first_year}" max="${last_year}">
                    </div>
                    <div class="col-auto">
                        <label for="dateRangeMax" class="form-label">Max</label>
                        <input type="number" class="form-control form-control-sm" id="dateRangeMax" name="date_range_end" min="${first_year}" max="${last_year}">
                    </div>
                    </div>
                    <div class="row mb-4">
                    <div class="col">
                        <div id="date-facet-slider" data-min="${first_year}" data-max="${last_year}"></div>
                    </div>
                    </div>
                    <div class="row justify-content-end">
                    <div class="col-auto">
                        <button type="submit" class="btn btn-secondary btn-sm">Set Date Range</button>
                    </div>
                    </div>
                </form>
            </div>
            `);
            let slider = dateRangeCard.find('#date-facet-slider')[0];
            let minInput = dateRangeCard.find('#dateRangeMin')[0];
            let maxInput = dateRangeCard.find('#dateRangeMax')[0];
            noUiSlider.create(slider, {
                start: [first_year, last_year],
                step: 1,
                range: {
                    'min': first_year,
                    'max': last_year,
                }
            });
            slider.noUiSlider.on('update', function (values, handle) {
                let value = values[handle];

                if (handle) {
                    maxInput.value = Math.round(value);
                } else {
                    minInput.value = Math.round(value);
                }
            });
            minInput.addEventListener('change', function () {
                slider.noUiSlider.set([this.value, null]);
            });

            maxInput.addEventListener('change', function () {
                slider.noUiSlider.set([null, this.value]);
            });
            dateRangeCard.find('#dateRangeFacet').submit(function (event) {
                event.preventDefault();
                let openedCanvas = bootstrap.Offcanvas.getInstance(offCanvas);
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                // Set because there can only be one date range
                queryParams.set("date_range_start", minInput.value);
                queryParams.set("date_range_end", maxInput.value);
                queryParams.delete("page");
                history.pushState(null, null, "?" + queryParams.toString());
                openedCanvas.hide();
                offCanvas[0].addEventListener('hidden.bs.offcanvas', event => {
                    listEvents(queryParams);
                });
            });
            offCanvas.children('.offcanvas-body').append(dateRangeCard);
        }
        if (eventsData[0].facets.titles.length) {
            hasFacets = true;
            let titlesCard = card.clone();
            titlesCard.children('.card-header').text("Titles");
            const titleDisplayFacets = eventsData[0].facets.titles;
            titleDisplayFacets.forEach(title => {
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("titles", title.title);
                queryParams.delete("page");
                titlesCard.children('.list-group').append(`
                <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-title="${title.title}">
                    ${title.title}
                    <span class="badge bg-secondary rounded-pill">${title.count}</span>
                </a>
                `);
            });
            titlesCard.find('a').on("click", function (event) {
                event.preventDefault();
                let title = $(this).data("title");
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("titles", title);
                queryParams.delete("page");
                history.pushState(null, null, "?" + queryParams.toString());
                let openedCanvas = bootstrap.Offcanvas.getInstance(offCanvas);
                openedCanvas.hide();
                offCanvas[0].addEventListener('hidden.bs.offcanvas', event => {
                    listEvents(queryParams);
                });
            });
            offCanvas.children('.offcanvas-body').append(titlesCard);

        }
        if (eventsData[0].facets.names.length) {
            hasFacets = true;
            let namesCard = card.clone();
            namesCard.children('.card-header').text("Names");
            const nameDisplayFacets = eventsData[0].facets.names.slice(0, 10);
            const nameHiddenFacets = eventsData[0].facets.names.slice(10);
            nameDisplayFacets.forEach(name => {
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("names[]", name.name);
                queryParams.delete("page");
                namesCard.children('.list-group').append(`
                <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-name="${name.name}">
                    ${name.name}
                    <span class="badge bg-secondary rounded-pill">${name.count}</span>
                </a>
                `);
            });
            if (nameHiddenFacets.length) {
                const namesCollapse = $(`
                <div class="collapse hidden-facets" id="collapse-names">
                </div>
                `);
                namesCard.children('.list-group').append(namesCollapse);
                namesCollapse.after(`
                <button class="list-group-item list-group-item-action expander d-inline-flex align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-names" aria-expanded="false" aria-controls="collapse-names">
                More >
                </button>
                `);
                namesCollapse[0].addEventListener('show.bs.collapse', event => {
                    namesCollapse.parent().children('button').text('Less ^')
                });
                namesCollapse[0].addEventListener('hide.bs.collapse', event => {
                    namesCollapse.parent().children('button').text('More >')
                });
                nameHiddenFacets.forEach(name => {
                    let queryParams = new URLSearchParams(window.location.search);
                    queryParams.append("names[]", name.name);
                    queryParams.delete("page");
                    namesCollapse.append(`
                    <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-name="${name.name}">
                        ${name.name}
                        <span class="badge bg-secondary rounded-pill">${name.count}</span>
                    </a>
                    `);
                });
            }
            namesCard.find('a').on("click", function (event) {
                event.preventDefault();
                let name = $(this).data("name");
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("names[]", name);
                queryParams.delete("page");
                history.pushState(null, null, "?" + queryParams.toString());
                let openedCanvas = bootstrap.Offcanvas.getInstance(offCanvas);
                openedCanvas.hide();
                offCanvas[0].addEventListener('hidden.bs.offcanvas', event => {
                    listEvents(queryParams);
                });
            });
            offCanvas.children('.offcanvas-body').append(namesCard);

        }
        if (eventsData[0].facets.categories.length) {
            hasFacets = true;
            let categoriesCard = card.clone();
            categoriesCard.children('.card-header').text("Categories");
            const categoriesDisplayFacets = eventsData[0].facets.categories.slice(0, 10);
            const categoriesHiddenFacets = eventsData[0].facets.categories.slice(10);
            categoriesDisplayFacets.forEach(category => {
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("categories[]", category.category);
                queryParams.delete("page");
                categoriesCard.children('.list-group').append(`
                <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-category="${category.category}">
                    ${category.category}
                    <span class="badge bg-secondary rounded-pill">${category.count}</span>
                </a>
                `);
            });
            if (categoriesHiddenFacets.length) {
                const categoriesCollapse = $(`
                <div class="collapse hidden-facets" id="collapse-categories">
                </div>
                `);
                categoriesCard.children('.list-group').append(categoriesCollapse);
                categoriesCollapse.after(`
                <button class="list-group-item list-group-item-action expander d-inline-flex align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-categories" aria-expanded="false" aria-controls="collapse-categories">
                More >
                </button>`);
                categoriesCollapse[0].addEventListener('show.bs.collapse', event => {
                    categoriesCollapse.parent().children('button').text('Less ^')
                });
                categoriesCollapse[0].addEventListener('hide.bs.collapse', event => {
                    categoriesCollapse.parent().children('button').text('More >')
                });
                categoriesHiddenFacets.forEach(category => {
                    let queryParams = new URLSearchParams(window.location.search);
                    queryParams.append("categories[]", category.category);
                    queryParams.delete("page");
                    categoriesCollapse.append(`
                    <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-category="${category.category}">
                        ${category.category}
                        <span class="badge bg-secondary rounded-pill">${category.count}</span>
                    </a>
                    `);
                });
            }
            categoriesCard.find('a').on("click", function (event) {
                event.preventDefault();
                let category = $(this).data("category");
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("categories[]", category);
                queryParams.delete("page");
                history.pushState(null, null, "?" + queryParams.toString());
                let openedCanvas = bootstrap.Offcanvas.getInstance(offCanvas);
                openedCanvas.hide();
                offCanvas[0].addEventListener('hidden.bs.offcanvas', event => {
                    listEvents(queryParams);
                });

            });
            offCanvas.children('.offcanvas-body').append(categoriesCard);

        }
        if (eventsData[0].facets.years.length) {
            hasFacets = true;
            let yearsCard = card.clone();
            yearsCard.children('.card-header').text("Years");
            const yearsDisplayFacets = eventsData[0].facets.years.slice(0, 10);
            const yearsHiddenFacets = eventsData[0].facets.years.slice(10);
            yearsDisplayFacets.forEach(year => {
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("year", year.year);
                queryParams.delete("date_range_start");
                queryParams.delete("date_range_end");
                queryParams.delete("page");
                yearsCard.children('.list-group').append(`
                <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-year="${year.year}">
                    ${year.year}
                    <span class="badge bg-secondary rounded-pill">${year.count}</span>
                </a>
                `);
            });
            if (yearsHiddenFacets.length) {
                const yearsCollapse = $(`
                <div class="collapse hidden-facets" id="collapse-years">
                </div>
                `);
                yearsCard.children('.list-group').append(yearsCollapse);
                yearsCollapse.after(`
                <button class="list-group-item list-group-item-action expander d-inline-flex align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-years" aria-expanded="false" aria-controls="collapse-years">
                More >
                </button>`);
                yearsCollapse[0].addEventListener('show.bs.collapse', event => {
                    yearsCollapse.parent().children('button').text('Less ^')
                });
                yearsCollapse[0].addEventListener('hide.bs.collapse', event => {
                    yearsCollapse.parent().children('button').text('More >')
                });
                yearsHiddenFacets.forEach(year => {
                    let queryParams = new URLSearchParams(window.location.search);
                    queryParams.append("year", year.year);
                    queryParams.delete("date_range_start");
                    queryParams.delete("date_range_end");
                    queryParams.delete("page");
                    yearsCollapse.append(`
                    <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-year="${year.year}">
                        ${year.year}
                        <span class="badge bg-secondary rounded-pill">${year.count}</span>
                    </a>
                    `);
                });
            }
            yearsCard.find('a').on("click", function (event) {
                event.preventDefault();
                let year = $(this).data("year");
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("year", year);
                queryParams.delete("date_range_start");
                queryParams.delete("date_range_end");
                queryParams.delete("page");
                history.pushState(null, null, "?" + queryParams.toString());
                let openedCanvas = bootstrap.Offcanvas.getInstance(offCanvas);
                openedCanvas.hide();
                offCanvas[0].addEventListener('hidden.bs.offcanvas', event => {
                    listEvents(queryParams);
                });
            });
            offCanvas.children('.offcanvas-body').append(yearsCard);
        }
        if (hasFacets) {
            $('#facet').html(`
            <button id="facet-button" class="btn btn-fit-pink floating-action" type="button" data-bs-toggle="offcanvas"
              data-bs-target="#facets" aria-controls="facets" aria-label="Facet results">
              <span class="action-container">
                <i class="fas fa-filter" aria-hidden="true" title="Facet results">
                </i>
                Facet
              </span>
            </button>
            `);
            $('#modal-container').append(offCanvas);
        }
    }

    function createGraphs(url) {
        // Only need graphs for multiple years of data?
        if ((eventsData[0].facets.years.length > 1) || (eventsData[0].facets.names.length > 1) || (eventsData[0].facets.categories.length > 1)) {
            let graphModal = $(`
            <div class="modal fade" id="graphModal" tabindex="-1" aria-labelledby="graphLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-xl">
                <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title fs-6" id="graphLabel">Graph Visualizations</h2>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="graph-loader" class="d-flex justify-content-center align-items-center">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Fetching data...</span>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
            `);
            $('#modal-container').append(graphModal);
            $('#graph').html(`
            <button id="graph-button" class="btn btn-fit-green floating-action" type="button" data-bs-toggle="modal"
              data-bs-target="#graphModal" aria-controls="graphModal" aria-label="Graph results">
              <span class="action-container">
                <i class="fas fa-chart-bar" aria-hidden="true" title="Graph results">
                </i>
                Graph
              </span>
            </button>
            `);
            const thisGraphModal = document.getElementById('graphModal');
            thisGraphModal.addEventListener('shown.bs.modal', event => {
                const modalBody = $(thisGraphModal).find('.modal-body');
                if (modalBody.children('.graph').length == 0) {
                    let thisURL = new URL(url, "https://fashioncalendar.fitnyc.edu/");
                    let queryParams = new URLSearchParams(thisURL.search);
                    queryParams.set("graph", "true");
                    queryParams.delete("page");
                    let graphURL = "/data-api/events?" + queryParams.toString();
                    fetch(graphURL)
                        .then((response) => response.json())
                        .then((data) => {
                            modalBody.empty();
                            graphsData = data;
                            data = null;
                            // Events per year
                            modalBody.append(`
                                <div class="graph">
                                    <h3>
                                    <span>Events Per Year</span>
                                    <button class="data-download btn btn-link link-dark ms-1 text-decoration-none p-0" data-type="by-year-chart" aria-label="Download data as csv"><i class="fas fa-download" aria-hidden="true" title="Download data as csv"></i></button>
                                    </h3>
                                    <canvas id="by-year-chart" aria-label="Chart of events per year" role="img"></canvas>
                                </div>
                            `);
                            const byYearChart = document.getElementById('by-year-chart');
                            yearChart = new Chart(byYearChart, {
                                type: 'bar',
                                data: {
                                    labels: eventsData[0].facets.years.map(row => row.year),
                                    datasets: [{
                                        label: '# of Events',
                                        data: eventsData[0].facets.years.map(row => row.count),
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    }
                                }
                            });
                            // Hosts per year
                            modalBody.append(`
                            <div class="graph">
                                <h3>
                                <span>Unique Hosts Per Year</span>
                                <button class="data-download btn btn-link link-dark ms-1 text-decoration-none p-0" data-type="hosts-by-year-chart" aria-label="Download data as csv"><i class="fas fa-download" aria-hidden="true" title="Download data as csv"></i></button>
                                </h3>
                                <canvas id="hosts-by-year-chart" aria-label="Chart of unique hosts per year" role="img"></canvas>
                            </div>
                            `);
                            const hostsByYearChart = document.getElementById('hosts-by-year-chart');
                            hostsyearChart = new Chart(hostsByYearChart, {
                                type: 'bar',
                                data: {
                                    labels: graphsData[0].uniqueHostsbyYear.map(row => row.year),
                                    datasets: [{
                                        label: '# of Hosts',
                                        data: graphsData[0].uniqueHostsbyYear.map(row => row.numberOfHosts),
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    }
                                }
                            });
                            // Categories
                            modalBody.append(`
                            <div class="graph">
                                <h3>
                                <span>Categories</span>
                                <button class="data-download btn btn-link link-dark ms-1 text-decoration-none p-0" data-type="events-per-category-chart" aria-label="Download data as csv"><i class="fas fa-download" aria-hidden="true" title="Download data as csv"></i></button>
                                </h3>
                                <canvas id="events-per-category-chart" aria-label="Chart of number of events per category" role="img"></canvas>
                            </div>
                            `);
                            const eventsPerCategoryChart = document.getElementById('events-per-category-chart');
                            eventsCategoryChart = new Chart(eventsPerCategoryChart, {
                                type: 'pie',
                                data: {
                                    labels: graphsData[0].categories.map(row => row.category),
                                    datasets: [{
                                        label: '# of Events',
                                        data: graphsData[0].categories.map(row => row.count),
                                    }]
                                },
                                options: {
                                    plugins: {
                                        legend: {
                                            display: false,
                                        }
                                    }
                                }
                            });
                            // Names
                            modalBody.append(`
                            <div class="graph">
                                <h3>
                                <span>Names</span>
                                <button class="data-download btn btn-link link-dark ms-1 text-decoration-none p-0" data-type="events-per-name-chart" aria-label="Download data as csv"><i class="fas fa-download" aria-hidden="true" title="Download data as csv"></i></button>
                                </h3>
                                <canvas id="events-per-name-chart" aria-label="Chart of number of events per name" role="img"></canvas>
                            </div>
                            `);
                            const eventsPerNameChart = document.getElementById('events-per-name-chart');
                            eventsNameChart = new Chart(eventsPerNameChart, {
                                type: 'pie',
                                data: {
                                    labels: graphsData[0].names.map(row => row.name),
                                    datasets: [{
                                        label: '# of Events',
                                        data: graphsData[0].names.map(row => row.count),
                                    }]
                                },
                                options: {
                                    plugins: {
                                        legend: {
                                            display: false,
                                        }
                                    }
                                }
                            });
                            $(".data-download").on("click", graphDownload);
                        })
                        .catch((error) => {
                            console.log(error);
                            modalBody.append(`
                            <div>
                            <h2>Error</h2>
                            <p class="lead">
                            Error loading graph data. Please try again.
                            </p>
                            </div>
                            `);
                        });
                }
            });
        }
    }

    const download = function (data, name) {

        // Creating a Blob for having a csv file format
        // and passing the data with type
        const blob = new Blob([data], { type: 'text/csv' });

        // Creating an object for downloading url
        const url = window.URL.createObjectURL(blob);

        // Creating an anchor(a) tag of HTML
        const a = document.createElement('a');

        // Passing the blob downloading url
        a.setAttribute('href', url);

        // Setting the anchor tag attribute for downloading
        // and passing the download file name
        a.setAttribute('download', name + '.csv');

        // Performing a download with click
        a.on("click",);
        URL.revokeObjectURL(url);
    }

    const csvmaker = function (data) {
        const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
        const header = Object.keys(data[0]);
        const csv = [
            header.join(','), // header row first
            ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        ].join('\r\n');
        return csv;
    }

    const graphDownload = async function (event) {
        const type = event.currentTarget.getAttribute('data-type');
        switch (type) {
            case 'by-year-chart': {
                const csvdata = csvmaker(eventsData[0].facets.years);
                download(csvdata, type);
                break;
            }
            case 'hosts-by-year-chart': {
                const csvdata = csvmaker(graphsData[0].uniqueHostsbyYear);
                download(csvdata, type);
                break;
            }
            case 'events-per-category-chart': {
                const csvdata = csvmaker(graphsData[0].categories);
                download(csvdata, type);
                break;
            }
            case 'events-per-name-chart': {
                const csvdata = csvmaker(graphsData[0].names);
                download(csvdata, type);
                break;
            }
        }
    }


    function initializeTypeahead() {
        const names = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            prefetch: "/data-api/suggester?type=names"
        });
        const categories = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            prefetch: "/data-api/suggester?type=categories"
        });
        let termSuggester = $('#data-search input').typeahead(
            {
                hint: false,
                highlight: true,
                minLength: 2

            },
            {
                name: 'names',
                source: names,
                limit: 10,
                templates: {
                    header: `<h2 class="typeahead-header">Names</h2>`,
                    suggestion: function (data) {
                        return `<div>${data}</div>`;
                    }
                }
            },
            {
                name: 'categories',
                source: categories,
                limit: 10,
                templates: {
                    header: `<h2 class="typeahead-header">Categories</h2>`,
                    suggestion: function (data) {
                        return `<div>${data}</div>`;
                    }
                }
            });
        termSuggester.on('typeahead:select', function (ev, data, dataset) {
            $(this).blur();
            // Update URL Query.
            let queryParams = new URLSearchParams();
            queryParams.set(`${dataset}[]`, data);
            history.pushState(null, null, "?" + queryParams.toString());
            termSuggester.typeahead('val', '')
            listEvents(queryParams);
        });
    }

    function initiateScroll() {
        if ('count' in eventsData[0]) {
            let queryParams = new URLSearchParams(window.location.search);
            let page = 1;
            if (queryParams.has('page') && queryParams.get('page')) {
                page = Number(queryParams.get('page'));
            }
            if ((page * 50) < eventsData[0].count) {
                let pagination = `
                <div class="row justify-content-center pagination-row">
                    <div class="col-auto">
                        <button id="load-button" class="btn btn-fit-green floating-action" type="button" aria-controls="searchFilters" aria-label="Load more results">
                            <span class="action-container">
                            <i class="fas fa-plus" aria-hidden="true" title="Load more results">
                            </i>
                            Load More
                            </span>
                        </button>
                    </div>
                </div>
                `;
                let status = $(`
                    <div class="page-load-status">
                        <div class="row justify-content-center pb-5 mb-5">
                            <div class="col-auto">
                            <div class="spinner-border infinite-scroll-request" role="status">
                                <span class="visually-hidden">Fetching data...</span>
                            </div>
                            </div>
                        </div>
                    </div>
                `);
                status.hide();
                $('#data-container').after(pagination).after(status);
                $("#load-button").on("click", loadNewEvents);
                status = null;
            }
        }
    };
    function loadNewEvents() {
        let queryParams = new URLSearchParams(window.location.search);
        let page = 1;
        if (queryParams.has('page') && queryParams.get('page')) {
            page = Number(queryParams.get('page'));
        }
        page = page + 1;
        queryParams.set('page', page);
        const url = "/data-api/events?" + queryParams.toString();
        history.pushState(null, null, "?" + queryParams.toString());
        $('.pagination-row').hide();
        $('.page-load-status').show();
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                eventsData = data;
                data = null;
                eventsData[0].results.forEach(event => {
                    $('#data-container').append(createListing(event));
                    event.names.forEach(name => {
                        if (!(namesList.includes(name._id))) {
                            namesList.push(name._id);
                            $('#modal-container').append(createNameModal(name));
                        }
                    });
                });
                attachClicks();
                if ((page * 50) < eventsData[0].count) {
                    $('.pagination-row').show();
                    $('.page-load-status').hide();
                } else {
                    $('.pagination-row').remove();
                    $('.page-load-status').remove();
                };
            })
            .catch((error) => {
                console.log(error);
                $('#data-container').append(`
                <div>
                <h2>Error</h2>
                <p class="lead">
                    Unable to load additional results.
                </p>
                </div>
                `);
            });
    }
    // Scroll to top button
    let mybutton = $("#top-button");

    mybutton.on("click", topFunction);

    // When the user scrolls down 20px from the top of the document, show the button
    window.onscroll = function () { scrollFunction() };

    function scrollFunction() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            mybutton.show();
        } else {
            mybutton.hide();
        }
    }

    // When the user clicks on the button, scroll to the top of the document
    function topFunction() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }
});

