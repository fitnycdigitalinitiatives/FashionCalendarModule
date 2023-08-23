$(document).ready(function () {
    initiateStartup();
    window.onpopstate = function () {
        $('#data-search input').typeahead('destroy');
        initiateStartup();
    }
    function initiateStartup() {
        var queryParams = new URLSearchParams(window.location.search);
        listEvents(queryParams);
        initializeTypeahead();
        $("#data-search").submit(function (event) {
            event.preventDefault();
            $(this).find('input').blur();
            $(this).find('button').blur();
            text = $(this).find('input').val();
            // Update URL Query.
            var queryParams = new URLSearchParams();
            queryParams.set("text", text);
            history.pushState(null, null, "?" + queryParams.toString());
            listEvents(queryParams);
        });
    }

    function listEvents(queryParams) {
        $('.modal').modal('hide');
        $('#data-container').empty();
        $('#facet-container').empty();
        $('#modal-container').empty();
        $('#results').text("");
        $('#query').empty().hide();
        $('#facet-button').empty();
        $('#data-search input').val("");
        let text = "";
        let names = "";
        let categories = "";
        let issue = "";
        let location = "";
        let year = "";
        let year_month = "";
        if (queryParams.toString()) {
            if (queryParams.has('text')) {
                text = queryParams.get('text');
                let newQueryParams = new URLSearchParams(window.location.search);
                newQueryParams.delete('text')
                $('#query').append(`
                <li class="list-inline-item">
                    <a href="?${newQueryParams.toString()}" class="remove-query link-secondary text-decoration-none"><i aria-hidden="true" title="Remove facet:" class="far fa-times-circle"></i><span class="visually-hidden">Remove facet:</span> ${text}</a>
                </li>
                `);
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
        }
        const url = "/data-api/events?" + queryParams.toString();
        $.getJSON(url, function (data) {
            const totalResults = data.count;
            let resultsText = ""
            if (totalResults > 1) {
                resultsText = `Showing ${Number(totalResults).toLocaleString()} events`;
            } else if (totalResults == 1) {
                resultsText = `Showing ${totalResults} event`;
            } else {
                resultsText = `Your search did not return any events. Please try again with another search term.`;
            }
            $('#results').text(resultsText);
            $('#query').show();
            let searchTerm = [];
            [text, names, categories, issue, year, year_month, location].forEach(value => {
                if (value) {
                    searchTerm.push(value);
                }
            });
            const namesList = [];
            data.results.forEach(event => {
                $('#data-container').append(createListing(event));
                event.names.forEach(name => {
                    if (!(namesList.includes(name._id))) {
                        namesList.push(name._id);
                        $('#modal-container').append(createNameModal(name));
                    }
                });
            });
            $('#modal-container').append(createFacets(data.facets));
            $('#modal-container').append(createViewerModal());
            $('#modal-container').append(createMapModal());
            // Attach listeners to new content
            $(".name-search").click(function (event) {
                event.preventDefault();
                let names = decodeURIComponent($(this).data("label"));
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("names[]", names);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            $(".issue-search").click(function (event) {
                event.preventDefault();
                let issue = decodeURIComponent($(this).data("calendar_id"));
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("issue[]", issue);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            $(".category-search").click(function (event) {
                event.preventDefault();
                let category = decodeURIComponent($(this).data("label"));
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("categories[]", category);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            $(".location-search").click(function (event) {
                event.preventDefault();
                let location = decodeURIComponent($(this).data("location"));
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("location", location);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            $(".year-month-search").click(function (event) {
                event.preventDefault();
                let year_month = decodeURIComponent($(this).data("year-month"));
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("year_month", year_month);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            $('.remove-query').click(function (event) {
                event.preventDefault();
                // Update URL Query.
                var queryParams = new URLSearchParams($(this).attr('href'));
                history.pushState(null, null, $(this).attr('href'));
                listEvents(queryParams);
            });
            initiateViewer();
            initiateMap();
        })
            .fail(function () {
                console.log("error");
                var error = `
            <div>
            <h2>Error</h2>
            <p class="lead">
              
            </p>
            </div>
            `;
                $('#data-container').append(error);
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
            <button class="location-map border-0 bg-transparent p-0 ms-1" data-bs-toggle="modal" data-bs-target="#mapModal" data-longitude="${event.location.coordinates[0]}" data-latitude="${event.location.coordinates[1]}" data-formattedAddress="${encodeURIComponent(event.formatted_address)}" aria-label="See this location on a map">
                <i class="fas fa-map" aria-hidden="true" title="See this location on a map">
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
    function createNameModal(name) {
        let nameModal = $(`
        <!-- Modal -->
        <div class="modal fade" id="nameInfo-${name._id}" tabindex="-1" aria-labelledby="nameInfo-${name._id}Label" aria-hidden="true">
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
            $(modalBody).append(`
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
            $(modalBody).append(categoryList);
        }

        //Add note to empty body
        if (!$.trim($(modalBody).html())) {
            $(modalBody).append("Unfortunately, it doesn't seem that we've been able to gather any information or categorize this name so far.")
        }

        return nameModal;
    }
    // Page viewer
    function createViewerModal() {
        let viewerModal = $(`
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
        `);
        return viewerModal;
    }
    function initiateViewer() {
        const viewerModal = document.getElementById('viewerModal')
        if (viewerModal) {
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
                // reset modal on close
                viewerModal.addEventListener('hidden.bs.modal', event => {
                    $(modalBody).html(`<div id="mirador-viewer-frame"></div>`);
                    $(modalTitle).empty();
                });
                $.getJSON(pageURL, function (data, status, xhr) {
                    $(modalBody).html(data.html);
                    $(modalTitle).find('a').attr({ "href": data["item-link"], "aria-disabled": "false" }).removeClass("disabled");
                    const manifest = $('#mirador-viewer').data('manifest');
                    const authorization = $('#mirador-viewer').data('authorization');
                    const canvas = $('#mirador-viewer').data('canvas');
                    const miradorConfig = {
                        id: "mirador-viewer",
                        workspaceControlPanel: {
                            enabled: false
                        },
                        window: {
                            allowClose: false,
                            allowFullscreen: true,
                            allowMaximize: false,
                        },
                        windows: [
                            {
                                manifestId: manifest,
                                thumbnailNavigationPosition: 'far-right',
                            }
                        ],
                    };
                    if (authorization) {
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
                    }
                    if (canvas) {
                        miradorConfig['windows'][0]['canvasId'] = canvas;
                    }
                    Mirador.viewer(miradorConfig);
                })
                    .fail(function () {
                        console.log(`Error retrieving ${calendar_id}, page ${calendar_page}`);
                        modalBody.textContent = `Error retrieving ${calendar_id}, page ${calendar_page}`;
                    });

            })
        }
    }
    // Maps
    function createMapModal() {
        let mapModal = $(`
        <!-- Modal -->
        <div class="modal fade" id="mapModal" tabindex="-1" aria-labelledby="mapLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title fs-5" id="mapLabel">Location</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
              </div>
            </div>
          </div>
        </div>
        `);
        return mapModal;
    }
    function initiateMap() {
        const mapModal = document.getElementById('mapModal')
        if (mapModal) {
            mapModal.addEventListener('show.bs.modal', event => {
                const button = event.relatedTarget;
                const longitude = button.getAttribute('data-longitude');
                const latitude = button.getAttribute('data-latitude');
                const formattedAddress = decodeURIComponent(button.getAttribute('data-formattedAddress'));
                const modalBody = mapModal.querySelector('.modal-body');
                $(modalBody).html(`<div id="viewer-map"></div>`);
                mapModal.addEventListener('shown.bs.modal', event => {
                    var container = L.DomUtil.get('viewer-map');
                    if (container != null) {
                        container._leaflet_id = null;
                    }
                    var map = L.map('viewer-map').setView([latitude, longitude], 12);
                    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZml0ZGlnaXRhbGluaXRpYXRpdmVzIiwiYSI6ImNqZ3FxaWI0YTBoOXYyenA2ZnVyYWdsenQifQ.ckTVKSAZ8ZWPAefkd7SOaA', {
                        id: 'mapbox/light-v10',
                        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>'
                    }).addTo(map);
                    var marker = L.marker([latitude, longitude]).addTo(map);
                    marker.bindPopup(formattedAddress).openPopup();
                });

            })
        }
    }

    function createFacets(facets) {
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
        if (facets.years.length > 1) {
            hasFacets = true;
            const first_year = facets.years[0].year;
            const last_year = facets.years[facets.years.length - 1].year;
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
            var slider = dateRangeCard.find('#date-facet-slider')[0];
            var minInput = dateRangeCard.find('#dateRangeMin')[0];
            var maxInput = dateRangeCard.find('#dateRangeMax')[0];
            noUiSlider.create(slider, {
                start: [first_year, last_year],
                step: 1,
                range: {
                    'min': first_year,
                    'max': last_year,
                }
            });
            slider.noUiSlider.on('update', function (values, handle) {
                var value = values[handle];

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
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                // Set because there can only be one date range
                queryParams.set("date_range_start", minInput.value);
                queryParams.set("date_range_end", maxInput.value);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            offCanvas.children('.offcanvas-body').append(dateRangeCard);
        }
        if (facets.names.length) {
            hasFacets = true;
            let namesCard = card.clone();
            namesCard.children('.card-header').text("Names");
            const nameDisplayFacets = facets.names.slice(0, 10);
            const nameHiddenFacets = facets.names.slice(10);
            nameDisplayFacets.forEach(name => {
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("names[]", name.name);
                namesCard.append(`
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
                namesCard.append(namesCollapse);
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
                    namesCollapse.append(`
                    <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-name="${name.name}">
                        ${name.name}
                        <span class="badge bg-secondary rounded-pill">${name.count}</span>
                    </a>
                    `);
                });
            }
            namesCard.find('a').click(function (event) {
                event.preventDefault();
                let name = $(this).data("name");
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("names[]", name);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            offCanvas.children('.offcanvas-body').append(namesCard);

        }
        if (facets.categories.length) {
            hasFacets = true;
            let categoriesCard = card.clone();
            categoriesCard.children('.card-header').text("Categories");
            const categoriesDisplayFacets = facets.categories.slice(0, 10);
            const categoriesHiddenFacets = facets.categories.slice(10);
            categoriesDisplayFacets.forEach(category => {
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("categories[]", category.category);
                categoriesCard.append(`
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
                categoriesCard.append(categoriesCollapse);
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
                    categoriesCollapse.append(`
                    <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-category="${category.category}">
                        ${category.category}
                        <span class="badge bg-secondary rounded-pill">${category.count}</span>
                    </a>
                    `);
                });
            }
            categoriesCard.find('a').click(function (event) {
                event.preventDefault();
                let category = $(this).data("category");
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("categories[]", category);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            offCanvas.children('.offcanvas-body').append(categoriesCard);

        }
        if (facets.years.length) {
            hasFacets = true;
            let yearsCard = card.clone();
            yearsCard.children('.card-header').text("Years");
            const yearsDisplayFacets = facets.years.slice(0, 10);
            const yearsHiddenFacets = facets.years.slice(10);
            yearsDisplayFacets.forEach(year => {
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("year", year.year);
                queryParams.delete("date_range_start");
                queryParams.delete("date_range_end");
                yearsCard.append(`
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
                yearsCard.append(yearsCollapse);
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
                    yearsCollapse.append(`
                    <a href="?${queryParams.toString()}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-year="${year.year}">
                        ${year.year}
                        <span class="badge bg-secondary rounded-pill">${year.count}</span>
                    </a>
                    `);
                });
            }
            yearsCard.find('a').click(function (event) {
                event.preventDefault();
                let year = $(this).data("year");
                // Update URL Query.
                let queryParams = new URLSearchParams(window.location.search);
                queryParams.append("year", year);
                queryParams.delete("date_range_start");
                queryParams.delete("date_range_end");
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            offCanvas.children('.offcanvas-body').append(yearsCard);
        }
        if (hasFacets) {
            $('#facet-button').html(`
            <button id="facet-button" class="btn btn-fit-pink floating-action" type="button" data-bs-toggle="offcanvas"
              data-bs-target="#facets" aria-controls="facets" aria-label="Facet results">
              <span class="action-container">
                <i class="fas fa-filter" aria-hidden="true" title="Facet results">
                </i>
                Facet results
              </span>
            </button>
            `);
            return offCanvas;
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
        var termSuggester = $('#data-search input').typeahead(
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
            var queryParams = new URLSearchParams();
            queryParams.set(`${dataset}[]`, data);
            history.pushState(null, null, "?" + queryParams.toString());
            termSuggester.typeahead('val', '')
            listEvents(queryParams);
        });
    }
});