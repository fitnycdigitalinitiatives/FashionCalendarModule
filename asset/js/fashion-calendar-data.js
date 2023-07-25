$(document).ready(function () {
    initiateStartup();
    window.onpopstate = function () {
        initiateStartup();
    }
    function initiateStartup() {
        var queryParams = new URLSearchParams(window.location.search);
        listEvents(queryParams);
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
        let text = "";
        let names = "";
        let categories = "";
        let issue = "";
        let location = "";
        if (queryParams.toString()) {
            if (queryParams.has('text')) {
                text = queryParams.get('text');
            }
            if (queryParams.has('names')) {
                names = queryParams.get('names');
            }
            if (queryParams.has('categories')) {
                categories = queryParams.get('categories');
            }
            if (queryParams.has('issue')) {
                issue = queryParams.get('issue');
            }
            if (queryParams.has('location')) {
                location = queryParams.get('location');
            }
        }
        $('.modal').modal('hide');
        $('#data-container').empty();
        $('#facet-container').empty();
        $('#modal-container').empty();
        $('#results').text("");
        $('#query').text("");
        $('#facet-button').empty();
        $('#data-search input').val(text);
        const url = "/data-api/events?" + queryParams.toString();
        $.getJSON(url, function (data) {
            const totalResults = data.count;
            let resultsText = ""
            if (totalResults > 1) {
                resultsText = `Showing ${Number(totalResults).toLocaleString()} results`;
            } else if (totalResults == 1) {
                resultsText = `Showing ${totalResults} result`;
            } else {
                resultsText = `Your search did not return any results. Please try again with another search term.`;
            }
            $('#results').text(resultsText);
            let searchTerm = [];
            [text, names, categories, issue, location].forEach(value => {
                if (value) {
                    searchTerm.push(value);
                }
            });
            $('#query').text(searchTerm.join(", "));
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
                let names = $(this).data("label");
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("names", names);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            $(".issue-search").click(function (event) {
                event.preventDefault();
                let issue = $(this).data("calendar_id");
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("issue", issue);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            $(".category-search").click(function (event) {
                event.preventDefault();
                let category = $(this).data("label");
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("categories", category);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            $(".location-search").click(function (event) {
                event.preventDefault();
                let location = $(this).data("location");
                // Update URL Query.
                var queryParams = new URLSearchParams();
                queryParams.set("location", location);
                history.pushState(null, null, "?" + queryParams.toString());
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
            <a href="#" class="date-search link-dark ms-1 text-decoration-none" data-date="${event.start_date}" aria-label="Search for this date">
                <i class="fas fa-search" aria-hidden="true" title="Search for this date">
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
                <a href="?names=${encodeURIComponent(name.label)}" class="name-search link-dark ms-1 text-decoration-none" data-id="${name._id}" data-label="${name.label}" aria-label="Search for this name">
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
            <a href="?location=${encodeURIComponent(event.location.coordinates)}" class="location-search link-dark ms-1 text-decoration-none" data-location="${event.location.coordinates}" aria-label="Search for this location">
                <i class="fas fa-search" aria-hidden="true" title="Search for this location">
                </i>
            </a>
            <button class="location-map border-0 bg-transparent p-0 ms-1" data-bs-toggle="modal" data-bs-target="#mapModal" data-longitude="${event.location.coordinates[0]}" data-latitude="${event.location.coordinates[1]}" data-formattedAddress="${event.formatted_address}" aria-label="See this location on a map">
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
                <a href="?issue=${encodeURIComponent(issue.calendar_id)}" class="issue-search link-dark ms-1 text-decoration-none" data-calendar_id="${issue.calendar_id}" data-calendar_page="${issue.calendar_page}" aria-label="Search for this issue">
                <i class="fas fa-search" aria-hidden="true" title="Search for this issue">
                </i>
                </a>
                <button class="page-view border-0 bg-transparent p-0 ms-1" data-bs-toggle="modal" data-bs-target="#viewerModal" data-calendar_id="${issue.calendar_id}" data-calendar_page="${issue.calendar_page}" data-displayTitle="${displayTitle}" aria-label="See this page">
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
                <a href="?categories=${encodeURIComponent(category.label)}" class="category-search link-dark ms-1 text-decoration-none" data-modal="#nameInfo-${name._id}" data-id="${category._id}" data-label="${category.label}" aria-label="Search for this category">
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
                <h2 class="modal-title fs-5" id="viewerLabel"></h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
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
            viewerModal.addEventListener('show.bs.modal', event => {
                const button = event.relatedTarget;
                const calendar_id = button.getAttribute('data-calendar_id');
                const calendar_page = button.getAttribute('data-calendar_page');
                const calendar_title = button.getAttribute('data-displayTitle');
                const pageURL = `/data-api/page?id=${encodeURIComponent(calendar_id)}&page=${encodeURIComponent(calendar_page)}`;
                const modalTitle = viewerModal.querySelector('.modal-title');
                const modalBody = viewerModal.querySelector('.modal-body');
                $(modalBody).html(`<div class="openseadragon-frame"><div class="loader"></div></div>`);
                $(modalTitle).html(`
                Page ${calendar_page}
                <br>
                <div class="issue-link">
                    <span>${calendar_title}</span>
                    <a class="btn btn-link link-dark ms-1 text-decoration-none p-0 disabled" aria-disabled="true" aria-label="View full issue"><i class="fas fa-book" aria-hidden="true" title="View full issue"></i></a>
                </div>
                `);
                $.getJSON(pageURL, function (data, status, xhr) {
                    $(modalBody).html(data.html);
                    $(modalTitle).find('a').attr({ "href": data["item-link"], "aria-disabled": "false" }).removeClass("disabled");
                    var currentViewer = $(modalBody).find('.openseadragon');
                    var currentViewerID = currentViewer.attr('id');
                    var iiifEndpoint = $(currentViewer).data('infojson');
                    var authtoken = $(currentViewer).data('authtoken');
                    var thumbnail = $(currentViewer).data('thumbnail');

                    function removeThumbnail(tiledImage, viewer, currentViewer) {

                        setTimeout(
                            function () {
                                viewer.world.removeItem(viewer.world.getItemAt(0));
                                viewer.viewport.goHome(true);
                                removeLoader(currentViewer);
                            }, 1000);
                        tiledImage.removeAllHandlers();
                    }

                    function removeLoader(currentViewer) {
                        $(currentViewer).parent().children('.loader').remove();
                    }

                    function addErrorMessage(currentViewer) {
                        var errorMessage = $(`
                            <div class="toast mx-1 bg-white fade show iiif-error" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
                            <div class="toast-header bg-danger text-white">
                                <strong class="me-auto">Unable to Load High-Resolution Image</strong>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                            </div>
                                            <div class="toast-body">
                                It seems we've run into some issues loading this image. Please try reloading the page or contacting us at <a href="mailto:repository@fitnyc.edu" target="_blank">repository@fitnyc.edu</a> if you continue to receive this message.
                            </div>
                            </div>
                        `);
                        $(currentViewer).append(errorMessage);
                        $('.media.show:not(.resource) .openseadragon .toast-header .btn-close').on("click", function () {
                            $(this).parents('.toast').hide();
                        });
                    }

                    if (thumbnail) {
                        var options = {
                            id: currentViewerID,
                            prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@2.4/build/openseadragon/images/',
                            showNavigator: true,
                            navigatorSizeRatio: 0.1,
                            minZoomImageRatio: 1,
                            maxZoomPixelRatio: 10,
                            controlsFadeDelay: 1000,
                            tileSources: {
                                type: 'image',
                                url: thumbnail,
                                x: 0,
                                y: 0
                            }
                        }
                        // if token exists, add ajax to the options
                        if (authtoken) {
                            options['loadTilesWithAjax'] = true;
                            options['ajaxHeaders'] = {
                                "Authorization": "Bearer " + authtoken
                            }
                        }

                        var viewer = OpenSeadragon(
                            options
                        );

                        //add the iiif tiles on top of the thumbnail and remove loader
                        var iiifoptions = {
                            tileSource: iiifEndpoint,
                            x: 0,
                            y: 0,
                            success: function (event) {
                                var tiledImage = event.item;
                                tiledImage.addHandler('fully-loaded-change', removeThumbnail(tiledImage, viewer, currentViewer));
                            },
                            error: function (event) {
                                removeLoader(currentViewer);
                                addErrorMessage(currentViewer);
                            }
                        }

                        viewer.addTiledImage(iiifoptions);
                        viewerModal.addEventListener('hidden.bs.modal', event => {
                            viewer.destroy();
                        });
                    } else {
                        var options = {
                            id: currentViewerID,
                            prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@2.4/build/openseadragon/images/',
                            showNavigator: true,
                            navigatorSizeRatio: 0.1,
                            minZoomImageRatio: 0.8,
                            maxZoomPixelRatio: 10,
                            controlsFadeDelay: 1000,
                            tileSources: iiifEndpoint
                        }
                        // if token exists, add ajax to the options
                        if (authtoken) {
                            options['loadTilesWithAjax'] = true;
                            options['ajaxHeaders'] = {
                                "Authorization": "Bearer " + authtoken
                            }
                        }
                        var viewer = OpenSeadragon(
                            options
                        );
                        viewer.addHandler("add-item-failed", function (event) {
                            removeLoader(currentViewer);
                            addErrorMessage(currentViewer);
                        });
                        viewer.world.addHandler('add-item', function (event) {
                            var tiledImage = event.item;
                            tiledImage.addHandler('fully-loaded-change', function () {
                                removeLoader(currentViewer);
                            });
                        });
                        viewerModal.addEventListener('hidden.bs.modal', event => {
                            viewer.destroy();
                        });
                    }
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
                const formattedAddress = button.getAttribute('data-formattedAddress');
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
        <div class="offcanvas offcanvas-start shadow border-end-0 show" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="facets" aria-labelledby="facetsLabel">
            <div class="offcanvas-header border-bottom">
            <h3 class="offcanvas-title" id="facetsLabel">
                Facets
            </h3>
            <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body p-0">
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
        if (facets.names.length) {
            hasFacets = true;
            let namesCard = card.clone();
            namesCard.children('.card-header').text("Names")
            facets.names.forEach(name => {
                namesCard.append(`
                <a href="?names=${name.name}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-name="${name.name}">
                    ${name.name}
                    <span class="badge bg-secondary rounded-pill">${name.count}</span>
                </a>
                `);
            });
            namesCard.children('a').click(function (event) {
                event.preventDefault();
                let name = $(this).data("name");
                // Update URL Query.
                var queryParams = new URLSearchParams(window.location.search);
                queryParams.append("names", name);
                history.pushState(null, null, "?" + queryParams.toString());
                listEvents(queryParams);
            });
            offCanvas.children('.offcanvas-body').append(namesCard);

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
});