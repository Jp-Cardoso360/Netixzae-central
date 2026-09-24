const menu = document.querySelector(".menu-itens");
const dashBoard = document.querySelector(".conteiner-dashboard");
const cadastro = document.querySelector(".conteiner-cadastro");
const openMenu = document.querySelector(".open");
const closeMenu = document.querySelector(".close");
const receita = document.querySelector(".conteiner-receita");
const sucess = document.querySelector(".sucess");
const conteinerCliente = document.querySelector(".conteiner-cliente");
const conteinerProdutos = document.querySelector(".conteiner-produtos-user");
const delete_user = document.querySelector(".fa-user-xmark");
const conteiner_delete = document.querySelector(".conteiner-delete");
const conteinerUpUser = document.querySelector(".conteiner-upUser");



menuOpen = () => {
  menu.style = "display:flex";
  closeMenu.style = "display:flex";
  openMenu.style = "display:none";
};
menuClose = () => {
  menu.style = "display:none";
  closeMenu.style = "display:none";
  openMenu.style = "display:flex";
};
conteiner1 = () => {
  dashBoard.style = "display:flex";
  cadastro.style = "display:none";
  menu.style = "display:none";
  closeMenu.style = "display:none";
  openMenu.style = "display:flex";
  receita.style = "display:none";
  sucess.style = "display:none";
  conteinerCliente.style = "display:none";
  conteinerProdutos.style = "display:none";
  conteiner_delete.style = "display:none";


};
conteiner2 = () => {
  dashBoard.style = "display:none";
  cadastro.style = "display:flex";
  menu.style = "display:none";
  closeMenu.style = "display:none";
  openMenu.style = "display:flex";
  receita.style = "display:none";
  sucess.style = "display:none";
  conteinerCliente.style = "display:none";
  conteinerProdutos.style = "display:none";
  conteiner_delete.style = "display:none";

};
conteiner3 = () => {
  receita.style = "display:flex";
  dashBoard.style = "display:none";
  cadastro.style = "display:none";
  menu.style = "display:none";
  closeMenu.style = "display:none";
  openMenu.style = "display:flex";
  sucess.style = "display:none";
  conteinerCliente.style = "display:none";
  conteinerProdutos.style = "display:none";
  conteiner_delete.style = "display:none";

};
conteiner4 = () => {
  conteinerCliente.style = "display:flex";
  receita.style = "display:none";
  dashBoard.style = "display:none";
  cadastro.style = "display:none";
  menu.style = "display:none";
  closeMenu.style = "display:none";
  openMenu.style = "display:flex";
  sucess.style = "display:none";
  conteinerProdutos.style = "display:none";
  conteiner_delete.style = "display:none";

};
conteiner5 = () => {
  conteinerProdutos.style = "display:flex";
  conteinerCliente.style = "display:none";
  receita.style = "display:none";
  dashBoard.style = "display:none";
  cadastro.style = "display:none";
  menu.style = "display:none";
  closeMenu.style = "display:none";
  openMenu.style = "display:flex";
  sucess.style = "display:none";
  conteiner_delete.style = "display:none";

};

del = () =>{
  conteiner_delete.style = "display:flex";
  conteinerCliente.style = "display:none";

}
closeDel = () =>{
  conteiner_delete.style = "display:none";
  conteinerCliente.style = "display:flex";

}
up = () =>{
 conteinerUpUser.style = "display:flex";
  conteinerCliente.style = "display:none";

}
closeUp = () =>{
  conteinerUpUser.style = "display:none";
  conteinerCliente.style = "display:flex";

}