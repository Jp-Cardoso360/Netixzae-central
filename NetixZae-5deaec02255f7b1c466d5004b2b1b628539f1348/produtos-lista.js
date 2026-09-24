const urlApiList = "https://netix-zae-api.vercel.app";

// Função para buscar produtos com base no ID do usuário
async function buscarProdutos() {
  // Obtém o valor digitado no campo de ID do usuário
  const idInput = document.querySelector(".id-user");
  const id = idInput.value;

  // Verifica se um ID foi fornecido
  if (!id) {
    alert("Por favor, insira um ID válido.");
    return;
  }

  try {
    console.log("Requisitando dados da API para ID:", id);
    
    const req = await fetch(`${urlApiList}/dashboard/${id}`);
    const res = await req.json();
    
    console.log("Resposta da API:", res);

    // Verifica se a resposta é válida e contém produtos
    if (!res || !Array.isArray(res) || res.length === 0) {
      alert("Nenhum produto encontrado para este ID.");
      return;
    }

    // Renderiza os produtos
    const listagem = document.querySelector(".produtos-list");
    if (!listagem) {
      console.error("Elemento '.produtos-list' não encontrado no DOM.");
      return;
    }

    const produtosRender = res
      .map((produto) => `
        <div class="produto">
          <img src="${produto.thumbnail_url}" alt="Imagem do produto" width="70px">
          <p>${produto.description}</p>
          <i class="fa-solid fa-gear" onclick="openEdit('${produto._id}', '${produto.description}', '${produto.price}', '${produto.thumbnail_url}', '${produto.description2}')"></i>
        </div>
      `)
      .join("");

    listagem.innerHTML = produtosRender;
    console.log("Produtos renderizados com sucesso!");

    alert("Produtos carregados com sucesso!");

    // Exibe o botão de adicionar novo produto
    const newProduct = document.querySelector(".newProduct");
    if (newProduct) {
      newProduct.style.display = "flex";
      console.log("Elemento '.newProduct' exibido.");
    } else {
      console.warn("Elemento '.newProduct' não encontrado no DOM.");
    }
  } catch (error) {
    console.error("Erro na busca:", error);
    alert("Erro ao buscar produtos: " + error.message);
  }
}

function openEdit(id, nome, valor, img, description2) {
  const edit = document.querySelector(".edit");
  edit.style.display = "flex";

  
  document.getElementById("att-nome").value = nome;
  document.querySelector(".nomeP").innerHTML = nome;
  document.getElementById("att-valor").value = valor;
  document.querySelector(".imgProduto").src = img;
  document.querySelector(".description2").value = description2;


  const atualizarButton = document.querySelector(".att-produtos");
  atualizarButton.onclick = function () {
    atualizarP(id);
  };
  console.log("Editor aberto para produto:", { id, nome, valor });

  const apagar = document.querySelector(".apagarProduto");

  apagar.onclick = function(){
    apagarProduto(id)
  }

  async function apagarProduto(id) {
  const id_user = document.querySelector(".id-user").value;
    
    const reqDelete = await fetch(`${urlApiList}/picole/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        user_id: id_user,
      },
    });
    if (!reqDelete.ok) {
      throw new Error(`Erro na API: ${reqDelete.status}`);
    }

    const res = await reqDelete.json();
    alert(res.Mensagem);
  edit.style.display = "none";
  buscarProdutos();
  }
}


async function atualizarP(id) {
  const id_user = document.querySelector(".id-user").value;

  try {
    const attNome = document.getElementById("att-nome").value;
    const attValor = document.getElementById("att-valor").value;
const description2 = document.querySelector(".description2").value;

    const reqAtt = await fetch(`${urlApiList}/atualizar/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        user_id: id_user,
      },
      body: JSON.stringify({
        description: attNome,
        description2: description2,
        price: attValor,
        status: true,
      }),
    });

    if (!reqAtt.ok) {
      throw new Error(`Erro na API: ${reqAtt.status}`);
    }

    const res = await reqAtt.json();
    alert("Produto atualizado com sucesso!");
    console.log("Produto atualizado:", res);

    
    const edit = document.querySelector(".edit");
    edit.style.display = "none";
  buscarProdutos();

  } catch (error) {
    console.error("Erro na atualização:", error);
    alert("Erro ao atualizar produto: " + error.message);
  }
}
const criarButton = document.querySelector(".new-produto");
criarButton.onclick = function () {
  novoProduto();
};

async function novoProduto() {
  const id_user2 = document.querySelector(".id-user").value;
  const newNome = document.getElementById("new-nome").value;
  const newValor = document.getElementById("new-valor").value;
  const linkImg = document.getElementById("linkImg").value;
  const description2 = document.querySelector(".description2").value;


  if (newNome == "" || newValor == "" || linkImg == "" || description2 == "") {
    alert("preencha todos os campos");
    return;
  }
  try {
    const reqNew = await fetch(`${urlApiList}/add-produto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user_id: id_user2,
      },
      body: JSON.stringify({
        user_id: id_user2,
        description: newNome,
        description2: description2,
        price: newValor,
        status: true,
        thumbnail: linkImg,
      }),
    });

    if (!reqNew.ok) {
      throw new Error(`Erro na API: ${reqNew.status}`);
    }

    const res = await reqNew.json();
    alert("Produto criado com sucesso!");
    console.log("Criado com sucesso:", res);

    const newConteiner = document.querySelector(".new-conteiner");
    newConteiner.style.display = "none";
  buscarProdutos();

  } catch (error) {
    console.error("Erro na criação:", error);
    alert("Erro ao criar produto: " + error.message);
  }
}

const edit = document.querySelector(".edit");
const closeEdit = document.querySelector(".closeEdit");
const closeNew = document.querySelector(".closeNew");
const newConteiner = document.querySelector(".new-conteiner");
const newProduct = document.querySelector(".newProduct");

closeEdit.addEventListener("click", function () {
  edit.style = "display:none";
});

newProduct.addEventListener("click", function () {
  newConteiner.style = "display:flex";
});

closeNew.addEventListener("click", function () {
  newConteiner.style = "display:none";
});
