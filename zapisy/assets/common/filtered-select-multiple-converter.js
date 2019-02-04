import * as $ from "jquery";

window.addEventListener('load',() => {
   const data = JSON.parse($("#filtered-select-multiple-data")[0].innerHTML);
   for(const widget of data){
      let wg = $(widget.id);
      wg.find(".selector-available > h2").addClass("text-light bg-info text-center mb-0").text(widget.txtAvailable)
          .parent().addClass("flex-fill p-0 text-center").removeClass("selector-available")
          .children("#id_rooms_from").addClass("form-control").attr('size', widget.size)
          .siblings("#id_rooms_add_all_link").text("Wybierz wszystkie");
      wg.find(".selector-chosen > h2").addClass("text-light bg-info text-center mb-0").text(widget.txtChosen)
          .parent().addClass("flex-fill p-0 text-center").removeClass("selector-chosen")
          .children("#id_rooms_to").addClass("form-control").attr('size', widget.size)
          .siblings("#id_rooms_remove_all_link").text("Usuń wszystkie");
      wg.find("#id_rooms_input").appendTo(wg).addClass("form-control");
      wg.find("#id_rooms_filter").remove();
      wg.children(".selector").addClass("d-flex justify-content-center").removeClass("selector")
          .children(".selector-chooser").addClass("p-2 list-unstyled align-self-center").removeClass("selector-chooser");
   }
});

window.addEventListener('load',() => {
    const data = JSON.parse($("#filtered-select-multiple-data-requirements")[0].innerHTML);
    for(const widget of data){
       let wg = $(widget.id);
       wg.find(".selector-available > h2").addClass("text-light bg-info text-center mb-0").text(widget.txtAvailable)
           .parent().addClass("flex-fill p-0 text-center").removeClass("selector-available")
           .children("#id_description-requirements_from").addClass("form-control").attr('size', widget.size)
           .siblings("#id_description-requirements_add_all_link").text("Wybierz wszystkie");
       wg.find(".selector-chosen > h2").addClass("text-light bg-info text-center mb-0").text(widget.txtChosen)
           .parent().addClass("flex-fill p-0 text-center").removeClass("selector-chosen")
           .children("#id_description-requirements_to").addClass("form-control").attr('size', widget.size)
           .siblings("#id_description-requirements_remove_all_link").text("Usuń wszystkie");
       wg.find("#id_description-requirements_input").appendTo(wg).addClass("form-control");
       wg.find("#id_description-requirements_filter").remove();
       wg.children(".selector").addClass("d-flex justify-content-center").removeClass("selector")
           .children(".selector-chooser").addClass("p-2 list-unstyled align-self-center").removeClass("selector-chooser");
    }
 });

 window.addEventListener('load',() => {
    const data = JSON.parse($("#filtered-select-multiple-data-effects")[0].innerHTML);
    for(const widget of data){
       let wg = $(widget.id);
       wg.find(".selector-available > h2").addClass("text-light bg-info text-center mb-0").text(widget.txtAvailable)
           .parent().addClass("flex-fill p-0 text-center").removeClass("selector-available")
           .children("#id_entity-effects_from").addClass("form-control").attr('size', widget.size)
           .siblings("#id_entity-effects_add_all_link").text("Wybierz wszystkie");
       wg.find(".selector-chosen > h2").addClass("text-light bg-info text-center mb-0").text(widget.txtChosen)
           .parent().addClass("flex-fill p-0 text-center").removeClass("selector-chosen")
           .children("#id_entity-effects_to").addClass("form-control").attr('size', widget.size)
           .siblings("#id_entity-effects_remove_all_link").text("Usuń wszystkie");
       wg.find("#id_entity-effects_input").appendTo(wg).addClass("form-control");
       wg.find("#id_entity-effects_filter").remove();
       wg.children(".selector").addClass("d-flex justify-content-center").removeClass("selector")
           .children(".selector-chooser").addClass("p-2 list-unstyled align-self-center").removeClass("selector-chooser");
    }
 });

 window.addEventListener('load',() => {
    const data = JSON.parse($("#filtered-select-multiple-data-learning-methods")[0].innerHTML);
    for(const widget of data){
       let wg = $(widget.id);
       wg.find(".selector-available > h2").addClass("text-light bg-info text-center mb-0").text(widget.txtAvailable)
           .parent().addClass("flex-fill p-0 text-center").removeClass("selector-available")
           .children("#id_syllabus-learning_methods_from").addClass("form-control").attr('size', widget.size)
           .siblings("#id_syllabus-learning_methods_add_all_link").text("Wybierz wszystkie");
       wg.find(".selector-chosen > h2").addClass("text-light bg-info text-center mb-0").text(widget.txtChosen)
           .parent().addClass("flex-fill p-0 text-center").removeClass("selector-chosen")
           .children("#id_syllabus-learning_methods_to").addClass("form-control").attr('size', widget.size)
           .siblings("#id_syllabus-learning_methods_remove_all_link").text("Usuń wszystkie");
       wg.find("#id_syllabus-learning_methods_input").appendTo(wg).addClass("form-control");
       wg.find("#id_syllabus-learning_methods_filter").remove();
       wg.children(".selector").addClass("d-flex justify-content-center").removeClass("selector")
           .children(".selector-chooser").addClass("p-2 list-unstyled align-self-center").removeClass("selector-chooser");
    }
 });