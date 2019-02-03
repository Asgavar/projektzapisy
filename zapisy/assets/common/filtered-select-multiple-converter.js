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
