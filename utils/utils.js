let doctypePayload = {
	doctype: "5e5f3ade436e69c4ad043b0b",
	guide: "5db157dd545208010092943a",
}
let options = {}
let users = [{
	access: {
		type: "view",
		invited: false
	},
	primary_name: {
		given_name: "",
		surname: ""
	},
	signature: {invoked: true },//signers
	email: '',
	signing_as: '',
	party: ''
}]

let zegal
let doctypes
async function initialize(key) {
	zegal =  new Zegal(key);
	await zegal.init();
	getDoctypes();
}

const toSnakeCase = (str) => {
	if(str) {
		return str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
			.map(x => x.toLowerCase())
			.join('_');
	}
}

async function getDoctypes() {

	let guideCats = await zegal.getDoctypes();
	let doctypeChooser = $('#doctypeChooser')
	let guideChooser = $('#guidesMenu')
	let accordion = $('#accordion')
	guideCats.forEach((guideCat) => {
		// button = $(`<button type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true"
		// 						aria-expanded="false">${guide.name}</button>`);
		// guideChooser.append(button)

		accordion.append($(`

			<div class="card">
				<div class="card-header" id="cat${toSnakeCase(guideCat.name)}">
					<h5 class="mb-0">
						<button role="button" class="btn btn-link collapsed" data-toggle="collapse" data-target="#${toSnakeCase(guideCat.name)}" aria-expanded="false"
							aria-controls="${toSnakeCase(guideCat.name)}">
							${guideCat.name}
						</button>
					</h5>
				</div>
			
				<div id="${toSnakeCase(guideCat.name)}" class="collapse card-body" aria-labelledby="cat${toSnakeCase(guideCat.name)}" data-parent="#accordion">
				</div>
			</div>

		

		`))
		const guideCatDiv = $(`#${toSnakeCase(guideCat.name)}`)
		guideCat.guides.map((guide) => {

			guideDiv = $(`<button type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true"
									aria-expanded="false">${guide.name}</button>`);
			guideCatDiv.append(guideDiv)
			const doctypeList = $(`<div class="dropdown-menu"></div >`)

			guide.doctypes.map((doctype) => {
				doctypes = $(`<button class="dropdown-item" href="#">${doctype.display_name}</button>`)
				doctypes.on('click', () => selectDoctype(guide._id, doctype.id, doctype.display_name));

				doctypeList.append(doctypes)
			})

			guideCatDiv.append(doctypeList)
		})
	})
}
// async function getDoctypes() {
// 	let doctypes = await zegal.getDoctypes();
// 	let doctypeChooser = $('#doctypeChooser')
// 	doctypes.forEach((guide) => {
// 		Object.entries(guide).forEach(([key, doctypes]) => {
// 			doctypes.map((doctype) => {
// 				button = $(`<button class="nav-link active" id="v-pills-home-tab" data-toggle="pill" role="tab" aria-controls="v-pills-home" aria-selected="true" onclick="selectDoctype(doctype.id)">${doctype.display_name}</button>`);
// 				button.on('click', () => selectDoctype(key, doctype.id, doctype.display_name));
// 				doctypeChooser.append(button)
// 			})
// 		})
// 	})
// }
async function createDocumentHandler() {
	doctypePayload = {
		...doctypePayload,
		title: document.getElementById("docTitle").value || 'New document',
		users
		// users: document.getElementById('addSignersInfo').checked ? [user]: []
	}
	options = {
		disableSignerAdd: !document.getElementById('enableAddSigners').checked,
		disablePreview: !document.getElementById('enablePreview').checked,
		disableDownload: !document.getElementById('enableDownload').checked
	}
	
	// document.getElementById('modalTitle').innerHTML = doctypePayload.title
	await zegal.createDocument(doctypePayload, options)
};


const selectDoctype = async(guideId, doctypeId, docName) => {
	const doctypeDetails = await zegal.getDoctypeSample(doctypeId)
	const partySelect = $('.party_select')
	partySelect.on('change', (e) => updateSignerRoles(e, doctypeDetails.parties));
	doctypeDetails.parties && doctypeDetails.parties.map((party) => {
		const option = $(`<option id='${party.id}'>${party.name}</option>`);
		partySelect.append(option)
	})
	document.getElementById("docTitle").value = docName
	doctypePayload.doctype = doctypeId
	doctypePayload.guide = guideId
}

const updateSignerRoles = (e, parties) => {
	const selectedParty = e.target.value
	const party = parties.find((party) => party.name === selectedParty)
	const roleSelect = $('.role_select')
	const user = users[e.target.id.charAt(5)]

	user[e.target.name] = $(`#${e.target.id} :selected`).text()
	roleSelect.empty()
	roleSelect.on('change', (e) => {
		const user = users[e.target.id.charAt(10)]
		user[e.target.name] = $(`#${e.target.id} :selected`).text()
	});
	party.signingRoles.map((role) => {
		const option = $(`<option>${role}</option>`);
		roleSelect.append(option)
	})
}

const populateSigners = () => {
	const signersBlock = $('#signersBlock')
	users.map((user, i) => {
		const signer = $(`
							<form class="col-11" id='form${i}'>
								<div class="form-group">
									<input type="text" class="form-control" id="given_name${i}" placeholder='First name' value='${user.primary_name.given_name}' onchange='updatePrimaryName(${i}, "given_name")'>
								</div>
								<div class="form-group">
									<input type="text" class="form-control" id="surname${i}" placeholder='Last name' value='${user.primary_name.surname}' onchange='updatePrimaryName(${i}, "surname")'>
								</div>
								<div class="form-group">
									<input type="email" class="form-control" id="email${i}" placeholder='Email' value='${user.email}' onchange='updateUser(${i}, "email")'>
								</div>
								<select class="form-group form-control party_select" id="party${i}" value='${user.party}' name='party'>
									<option>Select signer party</option>
								</select>
								<select class="form-group form-control role_select" id="signing_as${i}" value='${user.signing_as}' name='signing_as'>
									<option>Select signer role</option>
								</select>
								<hr/>
							</form>
						`)

		signersBlock.append(signer);

	})
}
const addSignerForm = () => {
	const signersBlock = $('#signersBlock')
	signersBlock.empty()
	users.push({
		access: {
			type: "view",
			invited: false
		},
		primary_name: {
			given_name: "",
			surname: ""
		},
		signature: { invoked: true },//signers
		email: '',
		signing_as: '',
		party: ''
	})
	populateSigners()
}

const updatePrimaryName = (i, name) => {
	const user = users[i].primary_name
	user[name] = document.getElementById(`${name}${i}`).value
	console.log('.............', name, user[name], document.getElementById(`${name}${i}`).value)
}
const updateUser = (i, name) => {
	const user = users[i]
	user[name] = document.getElementById(`${name}${i}`).value
	console.log('.............', name, user[name], document.getElementById(`${name}${i}`).value)
}