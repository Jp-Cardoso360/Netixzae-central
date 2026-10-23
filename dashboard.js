async function contarUsuarios() {
  try {
    const response = await fetch(`${urlNetixZae}/sessions-list-counts`);

    if (!response.ok) {
      throw new Error("Erro ao buscar a lista de usuários da API");
    }

    const usuarios = await response.json();

    const totalUsuarios = usuarios.length;

    document.querySelector(
      "#total-usuarios .dashboard-indicador__valor"
    ).textContent = totalUsuarios;
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

async function buscarReceitas() {
  try {
    const response = await fetch(`${urlNetixZae}/receita`);

    if (!response.ok) {
      throw new Error("Erro ao buscar receitas da API");
    }

    const receitas = await response.json();

    const total = receitas.reduce(
      (acc, receita) => acc + (receita.valor || 0),
      0
    );

    // Formata o valor total para o formato BRL
    const totalFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(total);

    document.querySelector(
      "#total .dashboard-indicador__valor"
    ).textContent = totalFormatado;
  } catch (error) {
    console.error("Erro:", error.message);
  }
}
contarUsuarios();
buscarReceitas();

const apiURL = `${urlNetixZae}/sessions-list-counts`;
const valorPlanoCompleto = 39.9;
const formatarMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const suspensionModal = document.querySelector("#suspensionModal");
const suspensionClient = document.querySelector("#suspensionClient");
const suspensionInput = document.querySelector("#suspensionInput");
const suspensionFeedback = document.querySelector("#suspensionFeedback");
const cancelSuspension = document.querySelector("#cancelSuspension");
const confirmSuspension = document.querySelector("#confirmSuspension");
let confirmSuspensionAction = null;
let suspensionModalOpener = null;

function closeSuspensionModal() {
  suspensionModal.hidden = true;
  suspensionInput.value = "";
  suspensionFeedback.textContent = "";
  suspensionFeedback.classList.remove("is-error");
  confirmSuspensionAction = null;
  suspensionModalOpener?.focus();
  suspensionModalOpener = null;
}

function openSuspensionModal(clientName, onConfirm, opener) {
  suspensionClient.textContent = `Cliente: ${clientName}`;
  suspensionInput.value = "";
  suspensionFeedback.textContent = "";
  suspensionFeedback.classList.remove("is-error");
  confirmSuspensionAction = onConfirm;
  suspensionModalOpener = opener;
  suspensionModal.hidden = false;
  suspensionInput.focus();
}

cancelSuspension.addEventListener("click", closeSuspensionModal);
suspensionModal.addEventListener("click", (event) => {
  if (event.target === suspensionModal) closeSuspensionModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !suspensionModal.hidden) closeSuspensionModal();
});
suspensionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") confirmSuspension.click();
});
confirmSuspension.addEventListener("click", async () => {
  if (suspensionInput.value.trim().toLocaleLowerCase("pt-BR") !== "suspender") {
    suspensionFeedback.textContent = 'Digite "suspender" para confirmar a suspensão.';
    suspensionFeedback.classList.add("is-error");
    suspensionInput.focus();
    return;
  }
  if (!confirmSuspensionAction) return;

  confirmSuspension.disabled = true;
  cancelSuspension.disabled = true;
  try {
    if (await confirmSuspensionAction()) closeSuspensionModal();
  } catch (error) {
    suspensionFeedback.textContent = error.message || "Não foi possível suspender a conta.";
    suspensionFeedback.classList.add("is-error");
  } finally {
    confirmSuspension.disabled = false;
    cancelSuspension.disabled = false;
  }
});

async function atualizarResumoPlanoCompleto() {
  const countElement = document.querySelector("#dashboard-planos-contagem");
  const totalElement = document.querySelector("#dashboard-planos-total");
  const individualValueElement = document.querySelector(
    "#dashboard-planos-valor-individual"
  );

  try {
    const [accountsResponse, plansResponse] = await Promise.all([
      fetch(apiURL),
      fetch(`${urlNetixZae}/metas/list`),
    ]);

    if (!accountsResponse.ok || !plansResponse.ok) {
      throw new Error("Não foi possível carregar os planos dos clientes.");
    }

    const [accounts, plans] = await Promise.all([
      accountsResponse.json(),
      plansResponse.json(),
    ]);

    if (!Array.isArray(accounts) || !Array.isArray(plans)) {
      throw new Error("A resposta da API de planos é inválida.");
    }

    const completePlanClients = accounts.filter((account) =>
      plans.some(
        (plan) =>
          plan.user_id === account._id &&
          String(plan.plano || "").trim().toLocaleLowerCase("pt-BR") === "completo"
      )
    );

    countElement.textContent = `${completePlanClients.length} ${completePlanClients.length === 1 ? "cliente" : "clientes"} com este plano`;
    totalElement.textContent = formatarMoeda.format(
      completePlanClients.length * valorPlanoCompleto
    );
    individualValueElement.textContent = formatarMoeda.format(valorPlanoCompleto);
  } catch (error) {
    console.error("Erro ao carregar recorrência do Plano Completo:", error);
    countElement.textContent = "Não foi possível carregar";
    totalElement.textContent = "—";
    individualValueElement.textContent = "—";
  }
}

atualizarResumoPlanoCompleto();

function createClientField(labelText, value) {
  const field = document.createElement("div");
  field.className = "client-field";

  const label = document.createElement("span");
  label.className = "client-field__label";
  label.textContent = labelText;

  const content = document.createElement("span");
  content.className = "client-field__value";
  content.textContent = value || "Não informado";

  field.append(label, content);
  return field;
}

async function DisplayAccounts() {
  try {
    // Fetch dados das APIs
    const accountsResponse = await fetch(apiURL);
    const accounts = await accountsResponse.json();

    const metasResponse = await fetch(`${urlNetixZae}/metas/list`);
    if (!accountsResponse.ok || !metasResponse.ok) {
      throw new Error("Não foi possível carregar clientes e metas.");
    }

    const metasResult = await metasResponse.json();
    const metas = Array.isArray(metasResult) ? metasResult : metasResult.value;
    if (!Array.isArray(accounts) || !Array.isArray(metas)) {
      throw new Error("A resposta de clientes ou metas é inválida.");
    }

    const container = document.querySelector(".conteiner-clientes");
    const searchInput = document.querySelector("#buscaCliente");
    const planFilter = document.querySelector("#filtroPlanoClientes");
    const count = document.querySelector("#clientes-count");
    const cards = [];
    container.replaceChildren();

    accounts.forEach((account) => {
      const userMeta = metas.find((meta) => meta.user_id === account._id);
      const planName = String(userMeta?.plano || "").trim() || "Sem plano";
      let accountStatus = String(userMeta?.status || "").trim().toLocaleLowerCase("pt-BR");
      const statusLabel = accountStatus === "ativo"
        ? "Ativo"
        : accountStatus === "suspenso"
          ? "Suspenso"
          : "Não configurado";
      const planFilterValue = planName === "Sem plano"
        ? "sem-plano"
        : planName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR");
      const phone = String(account.tel || "");
      const card = document.createElement("article");
      card.className = "client-card";

      const header = document.createElement("div");
      header.className = "client-card__header";

      const avatar = document.createElement("span");
      avatar.className = "client-card__avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = (account.nome || "?").trim().charAt(0).toUpperCase();

      const identity = document.createElement("div");
      identity.className = "client-card__identity";

      const name = document.createElement("h3");
      name.textContent = account.nome || "Nome não disponível";

      const identifier = document.createElement("span");
      identifier.className = "client-card__identifier";
      identifier.textContent = `ID ${account._id || "não disponível"}`;

      identity.append(name, identifier);

      const planBadge = document.createElement("span");
      planBadge.className = `client-card__plan-badge${planName !== "Sem plano" ? " is-active" : ""}`;
      planBadge.textContent = planName;

      header.append(avatar, identity, planBadge);

      const fields = document.createElement("div");
      fields.className = "client-card__fields";
      const statusField = createClientField("Status da conta", statusLabel);
      const statusValue = statusField.querySelector(".client-field__value");
      statusValue.classList.add("client-card__status");
      if (accountStatus === "ativo" || accountStatus === "suspenso") {
        statusValue.classList.add(`is-${accountStatus}`);
      }
      fields.append(
        createClientField("Telefone", phone),
        createClientField("E-mail", account.email),
        createClientField("Slug da loja", account.slug),
        statusField
      );

      const footer = document.createElement("div");
      footer.className = "client-card__footer";

      const systemLink = document.createElement("a");
      systemLink.className = "client-card__system-link";
      const updateSystemLink = () => {
        const currentSlug = String(account.slug || "").trim();
        systemLink.replaceChildren();
        systemLink.removeAttribute("href");
        systemLink.removeAttribute("target");
        systemLink.removeAttribute("rel");
        if (!currentSlug) {
          systemLink.textContent = "Slug indisponível";
          systemLink.setAttribute("aria-disabled", "true");
          return;
        }

        systemLink.href = `https://conectazap-lojas.vercel.app/${encodeURIComponent(currentSlug)}`;
        systemLink.target = "_blank";
        systemLink.rel = "noopener noreferrer";
        systemLink.removeAttribute("aria-disabled");
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-arrow-up-right-from-square";
        icon.setAttribute("aria-hidden", "true");
        systemLink.append(document.createTextNode("Acessar sistema "), icon);
      };
      updateSystemLink();

      const whatsapp = document.createElement("a");
      whatsapp.className = "client-card__whatsapp";
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits) {
        whatsapp.href = `https://wa.me/${phoneDigits}`;
        whatsapp.target = "_blank";
        whatsapp.rel = "noopener noreferrer";
        whatsapp.setAttribute("aria-label", `Conversar com ${account.nome || "cliente"} pelo WhatsApp`);
        whatsapp.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>';
      } else {
        whatsapp.textContent = "Sem telefone";
      }

      footer.append(systemLink, whatsapp);

      const feedback = document.createElement("p");
      feedback.className = "client-card__feedback";
      feedback.setAttribute("role", "status");
      feedback.setAttribute("aria-live", "polite");

      if (accountStatus === "ativo" || accountStatus === "suspenso") {
        const statusButton = document.createElement("button");
        statusButton.type = "button";
        statusButton.className = "client-card__status-toggle";

        const updateStatusControl = () => {
          const isActive = accountStatus === "ativo";
          statusValue.textContent = isActive ? "Ativo" : "Suspenso";
          statusValue.classList.toggle("is-ativo", isActive);
          statusValue.classList.toggle("is-suspenso", !isActive);
          statusButton.textContent = isActive ? "Conta ativa" : "Conta suspensa";
          statusButton.title = isActive
            ? "Clique para suspender esta conta"
            : "Clique para regularizar esta conta";
          statusButton.setAttribute(
            "aria-label",
            `${statusButton.textContent}. ${statusButton.title}.`
          );
          statusButton.classList.toggle("is-active", isActive);
          statusButton.classList.toggle("is-suspended", !isActive);
        };

        updateStatusControl();
        const saveAccountStatus = async (nextStatus) => {
          statusButton.disabled = true;
          statusButton.textContent = "Atualizando...";
          feedback.textContent = "";
          feedback.classList.remove("is-error");
          suspensionFeedback.textContent = "";
          suspensionFeedback.classList.remove("is-error");

          try {
            const response = await fetch(
              `${urlNetixZae}/metas/${encodeURIComponent(account._id)}/status`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
              }
            );
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(result.message || result.error || `Erro na API: ${response.status}`);
            }

            accountStatus = nextStatus;
            updateStatusControl();
            feedback.textContent = `Conta ${nextStatus === "suspenso" ? "suspensa" : "regularizada"} com sucesso.`;
            return true;
          } catch (error) {
            const errorMessage = error.message || "Não foi possível atualizar o status da conta.";
            if (nextStatus === "suspenso") {
              suspensionFeedback.textContent = errorMessage;
              suspensionFeedback.classList.add("is-error");
            } else {
              feedback.textContent = errorMessage;
              feedback.classList.add("is-error");
            }
            updateStatusControl();
            return false;
          } finally {
            statusButton.disabled = false;
          }
        };

        statusButton.addEventListener("click", async () => {
          if (accountStatus === "ativo") {
            openSuspensionModal(
              account.nome || "este cliente",
              () => saveAccountStatus("suspenso"),
              statusButton
            );
            return;
          }
          await saveAccountStatus("ativo");
        });
        footer.appendChild(statusButton);
      }

      card.append(header, fields, footer, feedback);
      container.appendChild(card);

      const searchableText = [account.nome, phone, account.email, account._id, account.slug, planName, statusLabel]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      cards.push({ element: card, searchableText, planFilterValue });
    });

    const emptyState = document.createElement("p");
    emptyState.className = "clientes-empty";
    emptyState.hidden = true;
    container.appendChild(emptyState);

    function filterClients() {
      const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
      const selectedPlan = planFilter.value;
      let visibleCount = 0;

      cards.forEach(({ element, searchableText, planFilterValue }) => {
        const matchesSearch = searchableText.includes(query);
        const matchesPlan = selectedPlan === "todos" || planFilterValue === selectedPlan;
        const isVisible = matchesSearch && matchesPlan;
        element.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      count.textContent = visibleCount;
      emptyState.hidden = visibleCount > 0;
      emptyState.textContent = !accounts.length
        ? "Nenhum cliente cadastrado."
        : query || selectedPlan !== "todos"
          ? "Nenhum cliente corresponde aos filtros selecionados."
          : "Nenhum cliente encontrado.";
    }

    searchInput.oninput = filterClients;
    planFilter.onchange = filterClients;
    filterClients();
  } catch (error) {
    console.error("Erro ao buscar os dados:", error);
    const container = document.querySelector(".conteiner-clientes");
    container.innerHTML = '<p class="clientes-empty">Não foi possível carregar os clientes.</p>';
  }
}

DisplayAccounts();

const upadate = document.querySelector(".upadate");
const load = document.querySelector(".loading");
const loadMensage = document.querySelector(".loadMensage");

upadate.addEventListener("click", function () {
  load.style = "display:flex";
  loadMensage.innerHTML = "Atualizando..";
  buscarReceitas();
  contarUsuarios();
  atualizarResumoPlanoCompleto();
  DisplayAccounts();

  setTimeout(function () {
    load.style = "display:none";
  }, 4000);
});
