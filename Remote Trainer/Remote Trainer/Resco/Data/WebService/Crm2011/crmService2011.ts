module Resco.Data.WebService.Crm2011 {
	export class CrmService2011 extends BaseCrmService {
		public static connect(login: SimpleLoginInfo, log?: (a: string, b: string) => void): ICrmService {
			var service = new CrmService2011();
			var serviceAddress: string;
			serviceAddress = "/XRMServices/2011/Organization.svc/web";
			service.url = CrmService2011._fixUrl(login.url);
			service.url += serviceAddress;
			service.log = log;
			return service;
		}

		private static _fixUrl(url: string): string {
			if (!url)
				return "";

			var lowerUrl = url.toLocaleLowerCase();
			if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://"))
				url = "https://" + url;			
			return url;
		}

		public constructor() {
			super();
			this.serverVersion = ServerVersionInfo.Crm2011;
		}

		public async executeFetch(fetchXml: string, ctx?: FetchRequestParams): Promise<any[]> {
			var result: Object[] = [];
			var action = "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/RetrieveMultiple";
			var xrm = new XrmSerializer();
			xrm.deserializeCrmPrimitiveTypes = !this.parseRawValue;

			if (!ctx)
				ctx = new FetchRequestParams();

			var maxCount = ctx.maxCount;
			while (maxCount > 0) {
				var q = ctx.prepareFetch(fetchXml, maxCount);
				var response = await this._invoke(action, q, this._writeFetchRequest, null, this);	// if reader is null we will receive the xml response from server
				var resultsNode = Resco.Data.Xml.findXmlElement(<XMLDocument>response, ["Envelope", "Body", "RetrieveMultipleResponse", "RetrieveMultipleResult"]);

				for (let nItem = 0; nItem < resultsNode.childNodes.length; nItem++) {
					var child = <Node>resultsNode.childNodes[nItem];
					if (child.nodeType === 1) {	
						var elementName = child.localName;
						if (elementName === "Entities") {
							var entities = child;

							for (var eItem = 0; eItem < entities.childNodes.length; eItem++) {
								var entityNode = <Node>entities.childNodes[eItem];
								let serverEntity = new ServerEntity();

								for (let nItem = 0; nItem < entityNode.childNodes.length; nItem++) {
									var entityChild = <Node>entityNode.childNodes[nItem];
									if (entityChild.nodeType === 1) {
										if (entityChild.localName === "Attributes") {
											xrm.deserialize(entityChild, serverEntity.attributes, !this.parseRawValue)
											result.push(serverEntity);
											maxCount--;
										}
										else if (entityChild.localName === "Id") {
											serverEntity.id = new Guid(entityChild.textContent);
					                    }
										else if (entityChild.localName === "LogicalName") {
											serverEntity.logicalName = entityChild.textContent;
					                    }
									}
								}
							}
						}
						else if (elementName === "MoreRecords") {
							ctx.hasMoreRecords = child.textContent === 'true';
						}
						else if (elementName === "PagingCookie") {
							ctx.pagingCookie = child.textContent.decodeXML();
						}
						else if (elementName === "MinActiveRowVersion") {
							var minActiveRowVersion = child.textContent;
							if (ctx.requestMinActiveRowVersion) {
								if (minActiveRowVersion && minActiveRowVersion !== "-1")
									ctx.minActiveRowVersion = minActiveRowVersion;
							}
							ctx.requestMinActiveRowVersion = false;
						}
					}
				}
				if (!ctx.hasMoreRecords)
					break;

				ctx.page++;
			}
			return result;
		}

		private _writeFetchRequest(context: any): string {
			var result = "<RetrieveMultiple xmlns=\"" + this.XrmServicesNS + "\">\
	<query xsi:type=\"b:FetchExpression\" xmlns:b=\"" + this.XrmNS + "\">\
		<b:Query>\
			" + (<string>context).encodeXML() + "\
		</b:Query>\
	</query>\
</RetrieveMultiple>\n"

			return result;
		}

		public createWritableEntity(entityName: string, initializer?: any): ICrmWritableEntity {
			return new CrmEntity2011(entityName);
		}

		public buildCreateRequest(entity: ICrmWritableEntity): any {
			var r = new InternalCreateRequest();
			r.set("Target", entity);
			return r;
		}

		public buildUpdateRequest(entity: ICrmWritableEntity): any {
			var r = new InternalRequest("Update");
			r.set("Target", entity);
			return r;
		}

		public buildUpsertRequest(entity: ICrmWritableEntity): any {
			var r = new InternalRequest("Upsert");		// Is there Upsert action in dyncrm2011?
			r.set("Target", entity);
			return r;
		}

		public buildDeleteRequest(entityName: string, id: string): any {
			var r = new InternalRequest("Delete");
			r.set("Target", new EntityReference(entityName, new Guid(id)));
			return r;
		}

		private static _closeSalesOrder(id: string, status: number, state: number): InternalRequest {
			if (state === 2 || state === 3) {
				var req = new InternalRequest(state === 3 ? "FulfillSalesOrder" : "CancelSalesOrder");
				req.set("OrderClose", this._createEntityRef("orderclose", "salesorder", id));
				req.set("Status", new OptionSetValue(status));
				return req;
			}
			return null;
		}

		private static _createEntityRef(name: string, targetName: string, id: string): CrmEntity2011 {
			var entity = new CrmEntity2011(name);
			var keyColumnName = targetName + "id";
			entity.add(keyColumnName, new EntityReference(targetName, new Guid(id)));
			return entity;
		}

		private static _createQuoteRequest(id: string, status: number, state: number, extendedInfo: Resco.Dictionary<string, any>): InternalRequest {
			// Check whether the quote is active first.
			if (state === 1)
				return null;

			if (state === 2 || state === 3) {
				var entity = CrmService2011._createEntityRef("quoteclose", "quote", id);
				var req = new InternalRequest(state === 2 ? "WinQuote" : "CloseQuote");
				req.set("QuoteClose", entity);
				req.set("Status", new OptionSetValue(status));

				if (extendedInfo) {
					if (extendedInfo.containsKey("actualend")) {
						var v = extendedInfo.getValue("actualend");
						entity.addTypeValue("actualend", CrmType.DateTime, v);
					}
					if (extendedInfo.containsKey("description")) {
						var v = extendedInfo.getValue("description");
						entity.addTypeValue("description", CrmType.String, v);
					}
				}

				return req;
			}
			return null;
		}

		private static _closeOpportunity(id: string, status: number, state: number, extendedInfo: Resco.Dictionary<string, any>): InternalRequest {
			if (state === 2 || state === 1) {
				var entity = CrmService2011._createEntityRef("opportunityclose", "opportunity", id);
				var args = new InternalRequest(state === 1 ? "WinOpportunity" : "LoseOpportunity");
				args.add("OpportunityClose", entity);
				args.add("Status", new OptionSetValue(status));

				if (extendedInfo)
					CrmService2011._initializeOpportunityClose(entity, extendedInfo);

				return args;
			}
			return null;
		}

		private static _initializeOpportunityClose(entity: ICrmWritableEntity, extendedInfo: Resco.Dictionary<string, any>): void {
			if (extendedInfo.containsKey("competitorid")) {
				var cid = extendedInfo.getValue("competitorid");
				entity.addTypeValue("competitorid", CrmType.Lookup, new EntityReference("competitor", new Guid(cid)));
			}
			if (extendedInfo.containsKey("actualrevenue")) {
				var v = extendedInfo.getValue("actualrevenue");
				entity.addTypeValue("actualrevenue", CrmType.Money, v);
			}
			if (extendedInfo.containsKey("actualend")) {
				var v = extendedInfo.getValue("actualend");
				entity.addTypeValue("actualend", CrmType.DateTime, v);
			}
			if (extendedInfo.containsKey("description")) {
				var v = extendedInfo.getValue("description");
				entity.addTypeValue("description", CrmType.String, v);
			}
		}

		private static _closeIncident(id: string, status: number, state: number): InternalRequest {
			if (state === 1) {
				var req = new InternalRequest("CloseIncident");
				req.set("IncidentResolution", this._createEntityRef("incidentresolution", "incident", id));
				req.set("Status", new OptionSetValue(status));
				return req;
			}
			return null;
		}

		private static _sendEmail(id: string): InternalRequest {
			return null;
		}

		public buildChangeStatusRequest(entityName: string, id: string, status: number, state: number, stateName: string, extendedInfo: Resco.Dictionary<string, any>): any {
			var req: InternalRequest;
			if (entityName === "salesorder")
				req = CrmService2011._closeSalesOrder(id, status, state);
			else if (entityName === "quote") 
				req = CrmService2011._createQuoteRequest(id, status, state, extendedInfo);
			else if (entityName === "opportunity")
				req = CrmService2011._closeOpportunity(id, status, state, extendedInfo);
			else if (entityName === "incident")
				req = CrmService2011._closeIncident(id, status, state);
			else if (entityName === "email" && status === 3 && extendedInfo && extendedInfo.containsKey("SendCrm"))
				req = CrmService2011._sendEmail(id);

			if (!req) {
				req = new InternalRequest("SetState");
				req.add("EntityMoniker", new EntityReference(entityName, new Guid(id)));
				req.add("State", new OptionSetValue(state));
				req.add("Status", new OptionSetValue(status));
			}
			req.nameSpace = "http://schemas.microsoft.com/crm/2011/Contracts";
			return req;
		}

		public buildChangeOwnerRequest(entityName: string, id: string, ownerId: string, ownerIdTarget: string): any {
			var req = new InternalRequest("Assign");
			req.add("Assignee", new EntityReference(ownerIdTarget, new Guid(ownerId)));
			req.add("Target", new EntityReference(entityName, new Guid(id)));
			req.nameSpace = "http://schemas.microsoft.com/crm/2011/Contracts";
			return req;
		}

		public buildUpdateManyToManyRequest(entityName: string, relationshipName: string, create: boolean, attribute1: string, k1: string, target1: string, attribute2: string, k2: string, target2: string): any {
			var args = new InternalRequest(null);
			if (entityName === "listmember") {
				args.name = create ? "AddMemberList" : "RemoveMemberList";
				args.nameSpace = "http://schemas.microsoft.com/crm/2011/Contracts";
				args.set("EntityId", k1);
				args.set("ListId", k2);
			}
			else if (entityName === "campaignitem") {
				args.name = create ? "AddItemCampaign" : "RemoveItemCampaign";
				args.nameSpace = "http://schemas.microsoft.com/crm/2011/Contracts";
				args.set("CampaignId", k1);
				args.set("EntityId", k2);
				args.set("EntityName", target2);
			}
			else if (entityName === "campaignactivity") {
				args.name = create ? "AddItemCampaignActivity" : "RemoveItemCampaignActivity";
				args.nameSpace = "http://schemas.microsoft.com/crm/2011/Contracts";
				args.set("CampaignActivityId", k1);
				args.set("ItemId", k2);
				args.set("EntityName", target2);
			}
			else {
				args.name = create ? "Associate" : "Disassociate";
				var rel = new Relationship();
				rel.schemaName = relationshipName;
				if (target1 === target2)
					rel.primaryEntityRole = "Referencing";
				args.set("Relationship", rel);
				args.set("Target", new EntityReference(target1, new Guid(k1)));
				args.set("RelatedEntities", [new EntityReference(target2, new Guid(k2))]);
			}
			return args;
		}

		public async convertQuote(quoteId: string, targetEntityName: string): Promise<string> {
			if (targetEntityName === "salesorder")
				return await this._convertSalesEntity(quoteId, "QuoteId", "salesorderid", "ConvertQuoteToSalesOrder");
			else if (targetEntityName === "quote")
				return await this._convertSalesEntity(quoteId, "QuoteId", "quoteid", "ReviseQuote");
			return null;
		}

		public async initializeFrom(sourceId: string, sourceEntityName: string, targetEntityName: string): Promise<ICrmWritableEntity> {
			var req = new InternalRequest("InitializeFrom");
			req.set("EntityMoniker", new EntityReference(sourceEntityName, new Guid(sourceId)));
			req.set("TargetEntityName", targetEntityName);
			req.set("TargetFieldType", new TargetFieldType(TargetFieldType.All));
			req.nameSpace = "http://schemas.microsoft.com/crm/2011/Contracts";

			var resp = await this._executeRequestInternal(req);
			var entity = resp["Entity"];

			var writable = new CrmEntity2011(entity.logicalName);
			for (var prop in entity) {
				if (prop !== "logicalName")		// !!! solve this. create ServerEntity and do not use plain Object for that purpose
					writable.add(prop, entity[prop]);
			}
			return writable;
		}

		public async _convertSalesEntity(id: string, sourceIdColumn: string, targetIdColumn: string, requestName: string): Promise<string> {
			var req = new InternalRequest(requestName);
			req.set(sourceIdColumn, new Guid(id));
			req.set("ColumnSet", new ColumnSet([targetIdColumn]));
			var result = await this._executeRequestInternal(req);
			return <string>(result["Entity"][targetIdColumn]);
		}

		public async executeRequest(request: any): Promise<any> {
			var internalRequest = <InternalRequest>request;
			var response = await this._executeRequestInternal(internalRequest);
			return internalRequest.parseResponse(response)
		}

		public async executeMultiple(requests: any[]): Promise<any[]> {
			var resp = new Array<any>(requests.length);

			var x = await this._executeMultipleInternal(requests);
			if (x) {
				x.forEach(r => {
					var rix = r.requestIndex;
					var result;
					if (r.fault)
						result = r.fault;
					else
						result = (<InternalRequest>requests[rix]).parseResponse(r);
					resp[rix] = result;
				});
			}
			return resp;
		}

		private async _invoke(action: string, context: any, writer: (obj: any) => string, reader: (response: XMLDocument) => Object, scope?: any): Promise<Object> {
			var requestXml = "<s:Envelope xmlns:xsi=\"" + this.XsiNS + "\" xmlns:xsd=\"" + this.XsdNS + "\" xmlns:s=\"" + this.SoapNS + "\"><s:Body>";
			if (writer) 
				requestXml += writer.call(scope || this, context);
			requestXml += "</s:Body></s:Envelope>"
			var responseXml = await Resco.Data.HttpRequest.executeXml("POST", this.url, requestXml, { "SOAPAction": action, "Content-Type": "text/xml; charset=utf-8"});
			return reader ? reader.call(scope || this, responseXml) : responseXml;
		}

		private _executeRequestWrite(context: any): string {
			var request = <InternalRequest>context;
			var result = "<Execute xmlns:b=\"" + this.XrmNS + "\" xmlns:c=\"" + this.DataContractNS + "\" xmlns:s=\"" + this.SerializationNS + "\" xmlns=\"" + this.XrmServicesNS + "\"><request>"

			if (request.length > 0) {
				var xrm = new XrmSerializer();
				xrm.sendPicklistNull = false; // TODO: this.m_settings.sendPicklistNull;
				result += xrm.serialize("b:Parameters", request);
			}
			result += "<b:RequestName>" + request.name + "</b:RequestName></request></Execute>";

			return result;
		}

		private _executeMultipleRequestWrite(context: any): string {
			var requests = <InternalRequest[]>context;
			var result = "<Execute xmlns:b=\"" + this.XrmNS + "\" xmlns:c=\"" + this.DataContractNS + "\" xmlns:i=\"" + this.XsiNS + "\" xmlns:s=\"" + this.SerializationNS + "\" xmlns=\"" + this.XrmServicesNS + "\">\
	<request i:type=\"b:ExecuteMultipleRequest\">\
		<b:Parameters>\
			<b:KeyValuePairOfstringanyType>\
				<c:key>Requests</c:key>\
				<c:value xmlns:x=\"" + this.XrmNS2012 + "\" i:type=\"x:OrganizationRequestCollection\">"

			var xrm = new XrmSerializer();
			xrm.sendPicklistNull = false; // TODO: this.m_settings.sendPicklistNull;

			requests.forEach(request => {
				var requestBody = "<x:OrganizationRequest "

				var prefix = "b:";
				if (request.nameSpace) {
					prefix = "a:";
					requestBody += "xmlns:a=\"" + request.nameSpace + "\" ";
				}
				requestBody += "i:type=\"" + prefix + request.typeName + "\">";
				requestBody += xrm.serialize("b:Parameters", request);
				requestBody += "<b:RequestName>" + request.name + "</b:RequestName>";
				requestBody += "</x:OrganizationRequest>";
				result += requestBody;
			}, this);

			result += "</c:value>\
			</b:KeyValuePairOfstringanyType>\
			<b:KeyValuePairOfstringanyType>\
				<c:key>Settings</c:key>\
				<c:value xmlns:x=\"" + this.XrmNS2012 + "\" i:type=\"x:ExecuteMultipleSettings\">\
					<x:ContinueOnError>true</x:ContinueOnError>\
					<x:ReturnResponses>true</x:ReturnResponses>\
				</c:value>\
			</b:KeyValuePairOfstringanyType>\
		</b:Parameters>\
		<b:RequestName>ExecuteMultiple</b:RequestName>\
	</request>\
</Execute>";
			return result;
		}

		private _executeRequestRead(response: XMLDocument): Object {
			var responseResults = Resco.Data.Xml.findXmlElement(response, ["Envelope", "Body", "ExecuteResponse", "ExecuteResult", "Results"]);
			var xrm = new XrmSerializer();
			var result = new Object();

			xrm.deserialize(responseResults, result);

			return result;
		}

		private async _executeRequestInternal(request: InternalRequest): Promise<Object> {
			var action = "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute";
			return await this._invoke(action, request, this._executeRequestWrite, this._executeRequestRead, this);
		}

		private async _executeMultipleInternal(requests: any[]): Promise<InternalResponse[]> {
			var action = "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute";
			var writer = this._executeMultipleRequestWrite;
			//if (this.m_settings.sendPicklistNull)
			//	writer = this._executeMultipleRequestWriteNew;

			var result = await this._invoke(action, requests, writer, this._executeRequestRead, this);
			return <InternalResponse[]>result["Responses"];
		}

		public async whoAmI(): Promise<WhoAmI> {
			var response = await this._executeRequestInternal(new InternalRequest("WhoAmI"));
			var result = new WhoAmI();
			result.organizationId = response["OrganizationId"];
			result.userId = response["UserId"];
			result.businessUnitId = response["BusinessUnitId"];
			return result;
		}

		SoapNS: string = "http://schemas.xmlsoap.org/soap/envelope/";
		XrmNS: string = "http://schemas.microsoft.com/xrm/2011/Contracts"
		XrmNS2012: string = "http://schemas.microsoft.com/xrm/2012/Contracts"
		XrmServicesNS: string = "http://schemas.microsoft.com/xrm/2011/Contracts/Services";
		XsiNS: string = "http://www.w3.org/2001/XMLSchema-instance";
		DataContractNS: string = "http://schemas.datacontract.org/2004/07/System.Collections.Generic";
		SerializationNS: string = "http://schemas.microsoft.com/2003/10/Serialization/";
		XsdNS: string = "http://www.w3.org/2001/XMLSchema";
		XmlNS: string = "http://www.w3.org/2000/xmlns/";

		public url: string;
		public log: (a: string, b: string) => void;
		public supportsManyToMany: boolean;
		public serverVersion: number;
	}

	export class CrmEntity2011 extends Resco.Dictionary<string, any> implements ICrmWritableEntity {
		public logicalName: string;
		public primaryKey: string[];
		public action: string;

		constructor(entityName: string) {
			super();
			this.logicalName = entityName;
		}

		public addTypeValue(name: string, type: CrmType, value: any) {
			if (value !== null && value !== undefined) {
				if (type === CrmType.Picklist || type == CrmType.Status || type == CrmType.State) {
					value = new OptionSetValue(+value);
				}
				else if (type === CrmType.Money) {
					value = new CrmMoney(+value);
				}
				else if (type === CrmType.BigInt || type === CrmType.Integer) {
					value = new Integer(+value);
				}
				else if (type === CrmType.Decimal) {
					value = new Decimal(value);
				}
				else if (type === CrmType.PrimaryKey) {
					value = new Guid(value);
				}
				else if (type === CrmType.PartyList) {
					var partyList: CrmEntity2011[] = [];
					var bindingList = Resco.BindingList.as(value);
					if (bindingList) {
						bindingList.list.forEach(ref => {
							var party = new CrmEntity2011("activityparty");
							var srcParty = ActivityParty.as(ref);
							var isDirect = false;
							if (srcParty !== null) {
								isDirect = srcParty.isDirectParty;
								if (srcParty.addressUsed) {
									party.addTypeValue("addressused", CrmType.String, srcParty.addressUsed);
								}
							}
							if (!isDirect) {
								party.addTypeValue("partyid", CrmType.Lookup, ref);
							}
							partyList.push(party);
						}, this);
					}
					value = partyList;
				}
			}
			super.add(name, value);
		}

		public enumerate(): Resco.IEnumerable<Resco.KeyValuePair<string, any>> {			
			var convDict = new Resco.Dictionary<string, any>();

			this.forEach(kv => {
				var value = kv.value;
				if (value instanceof OptionSetValue)
					value = value.Value;
				else if (value instanceof CrmMoney)
					value = value.Value;
				else if (value instanceof Integer) 
					value = value.Value;
				else if (value instanceof Decimal) 
					value = value.Value;
				else if (value instanceof Guid)
					value = value.toString();
				else if ((Object.prototype.toString.call(value) === '[object Array]') && (<Array<any>>value).every(item => item instanceof CrmEntity2011))
					value = (<Array<CrmEntity2011>>value).map(x => <EntityReference>x.getValue("partyid"));
				
				convDict.add(kv.key, value);
			});
			return convDict;
		}

		public setLoadedVersion(name: string, value: any): void {
			// The version number can be used for concurency control, so that we never overwrite a newer record on the server.
			// Supported on CRM2016+
		}
	}

	export class InternalResponse extends Resco.Dictionary<string, any> {
		public requestIndex: number;
		public fault: Resco.Exception;
		public name: string;
	}

	export class InternalRequest extends Resco.Dictionary<string, any> {
		public nameSpace: string;
		public name: string;
		public get typeName(): string {
			return this.name + "Request";
		}

		constructor(name: string) {
			super();
			this.name = name;
		}

		public parseResponse(response: Object): any {
			return null;
		}
	}

	class InternalCreateRequest extends InternalRequest {
		public nameSpace: string;
		public name: string;
		public get typeName(): string {
			return this.name + "Request";
		}

		constructor() {
			super("Create");
		}

		public parseResponse(response: Object): any {
			return response["id"];
		}
	}
}
