$(document).ready(function () {
    if ($('.glider').length) {
        $('.glider').each(function (index) {
            const id = 'glider-' + index;
            $(this).parent().parent().attr('id', id);
            new Glider(this, {
                slidesToShow: 2.5,
                slidesToScroll: 2,
                draggable: true,
                arrows: {
                    prev: '#' + id + ' .btnPrevious',
                    next: '#' + id + ' .btnNext'
                },
                responsive: [{
                    // screens greater than >= 576px
                    breakpoint: 576,
                    settings: {
                        // Set to `auto` and provide item width to adjust to viewport
                        slidesToShow: 3,
                        slidesToScroll: 3
                    }
                }, {
                    breakpoint: 992,
                    settings: {
                        slidesToShow: 4,
                        slidesToScroll: 4
                    }
                }, {
                    breakpoint: 1400,
                    settings: {
                        slidesToShow: 5,
                        slidesToScroll: 5
                    }
                }]
            });
        });

    }
    $(".expander").on("click.fashionCalendar", function (event) {
        event.preventDefault();
        if (!$(this).hasClass("selected")) {
            $(this).addClass("selected");
            $(this).parent().children(":not(.selected)").prop('disabled', true);
            $(this).append(`
            <div class="deselect-icon">
                <i class="fas fa-times" aria-hidden="true" title="Deselect this decade"></i>
                <span class="sr-only">Deselect this decade</span>
            </div>
            `);
            const collection = $(this).data("collection");
            const dateProperty = $(this).data("date-property");
            let queryParams = new URLSearchParams();
            queryParams.set("type", $(this).data("type"));
            queryParams.set("number", $(this).data("number"));
            queryParams.set("collection", collection);
            const url = "/data-api/browse?" + queryParams.toString();
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    data.sort((a, b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));
                    let newGlider = $(`
                <div class="row align-items-center justify-content-around secondary-glider">
                    <div class="col-auto order-first pe-0 d-none d-sm-block">
                        <button class="btn-arrow btnPrevious ps-0 border-0 bg-transparent text-secondary" type="button"
                            aria-label="Previous">
                            <i class="fas fa-chevron-left" aria-hidden="true" title="Previous">
                            </i>
                        </button>
                    </div>
                    <div class="col-auto order-last ps-0 d-none d-sm-block">
                        <button class="btn-arrow btnNext pe-0 border-0 bg-transparent text-secondary" type="button"
                            aria-label="Next">
                            <i class="fas fa-chevron-right" aria-hidden="true" title="Next">
                            </i>
                        </button>
                    </div>
                    <div class="col overflow-hidden px-0">
                        <div class="glider">
                        </div>
                    </div>
                </div>
                `);
                    let thisGlider = newGlider.find(".glider");
                    data.forEach(item => {
                        const urlLink = `/item?sort_by=dcterms%3Adate&property%5B0%5D%5Bjoiner%5D=and&property%5B0%5D%5Bproperty%5D=${dateProperty}&property%5B0%5D%5Btype%5D=sw&property%5B0%5D%5Btext%5D=${item.time}&item_set_id%5B0%5D=${collection}&sort_order=asc`;
                        thisGlider.append(`
                    <div class="card border-0 px-sm-3 px-xl-4" data-type="decade" data-number="${item.time}">
                        <a class="card-img" href="${urlLink}">
                            <img class="browse-thumbnail shadow-sm rounded" alt="${item.time} Cover" src="${item.thumbnail}">
                        </a>
                        <div class="card-body overflow-hidden">
                            <h3>
                                <a href="${urlLink}" class="text-dark text-decoration-none">
                                ${item.time}
                                </a>
                            </h3>
                        </div>
                    </div>
                    `);
                    });
                    const id = 'glider-' + $(this).data("number");
                    thisGlider.attr('id', id);
                    const gliderInstance = new Glider(thisGlider[0], {
                        slidesToShow: 2.5,
                        slidesToScroll: 2,
                        draggable: true,
                        arrows: {
                            prev: '#' + id + ' .btnPrevious',
                            next: '#' + id + ' .btnNext'
                        },
                        responsive: [{
                            // screens greater than >= 576px
                            breakpoint: 576,
                            settings: {
                                // Set to `auto` and provide item width to adjust to viewport
                                slidesToShow: 3,
                                slidesToScroll: 3
                            }
                        }, {
                            breakpoint: 992,
                            settings: {
                                slidesToShow: 4,
                                slidesToScroll: 4
                            }
                        }, {
                            breakpoint: 1400,
                            settings: {
                                slidesToShow: 5,
                                slidesToScroll: 5
                            }
                        }]
                    });
                    $(this).parents(".browse-preview").append(newGlider);
                    gliderInstance.refresh();
                })
                .catch((error) => {
                    console.log(error);
                });
        } else {
            $(this).parents(".browse-preview").find(".secondary-glider").remove();
            $(this).removeClass("selected");
            $(this).find(".deselect-icon").remove();
            $(this).parents(".browse-preview").find(".expander").prop('disabled', false);
        }
    });
});