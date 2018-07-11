module Resco.Data.WebService.Crm2011 {
	export class XrmSerializer {
		public deserializeCrmPrimitiveTypes: boolean;

		public sendPicklistNull: boolean;

		public constructor() {
			this.sendPicklistNull = true;
		}

		public deserialize(parent: Node, target: any, decomposeReference: boolean = false) {
			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				var child = <Node>parent.childNodes[nItem];
				if (child.nodeType === 1) {
					this._parseKeyValuePair(child, target, decomposeReference);
				}
			}
		}

		private _parseKeyValuePair(parent: Node, target: any, decomposeReference: boolean) {
			var value: any = null;
			var name: string = null;

			for (var nItem = 0; nItem < parent.childNodes.length; nItem++) {
				var child = <Node>parent.childNodes[nItem];
				if (child.nodeType === 1) {
					var elementName = child.localName;
					if (elementName == "key") {
						name = child.textContent;
					}
					else if (elementName == "value") {
						value = this._parseValue(child);
					}
				}
			}
			if (name) {
				if (decomposeReference) {
					var ref = EntityReference.as(value);
					if (ref) {
						target[name] = ref.Id;
						target[name + "Target"] = ref.LogicalName;
						target[name + "Label"] = ref.Name;
						return;
					}
				}
				target[name] = value;
			}
		}
		private _parseValue(child: Node): any {
			var value;
			var valueType = this._getXmlAttribute(child, "type");
			if (valueType !== null) {
				var valueType = valueType.substr(valueType.indexOf(':') + 1);
				switch (valueType) {
					case "string":
						value = child.textContent.decodeXML();
						break;
					case "boolean":
						value = child.textContent === "true";
						break;
					case "guid":
						value = new Guid(child.textContent);
						break;
					case "int":
						value = new Integer(+child.textContent);
						break;
					case "double":
						value = +child.textContent;
						break;
					case "decimal":
					case "Money":
						if (this.deserializeCrmPrimitiveTypes)
							value = new Decimal(+child.textContent);
						else
							value = new CrmMoney(+child.textContent);
						break;
					case "dateTime":
						value = new DateTime(child.textContent);
						break;
					case "OptionSetValue":
						var z = Resco.Data.Xml.findXmlElement(child, ["Value"]);
						if (z != null) {
							if (this.deserializeCrmPrimitiveTypes)
								value = +z.textContent;
							else
								value = new OptionSetValue(+z.textContent);
						}
						break;
					case "EntityReference":
						let id = Resco.Data.Xml.findXmlElementValue(child, ["Id"]);
						let logicalName = Resco.Data.Xml.findXmlElementValue(child, ["LogicalName"]);
						let label = Resco.Data.Xml.findXmlElementValue(child, ["Name"]);
						value = new EntityReference(logicalName, new Guid(id), label);
						break;
					case "OptionSetValue":
						break;
					case "AliasedValue":
						var vnode = Resco.Data.Xml.findXmlElement(child, ["Value"]);
						if (vnode)
							value = this._parseValue(vnode);
						break;
					case "Entity": {
						value = new Object();
						var attrNode = Resco.Data.Xml.findXmlElement(child, ["Attributes"]);
						this.deserialize(attrNode, value);
						value.logicalName = Resco.Data.Xml.findXmlElementValue(child, ["LogicalName"]);
						break;
					}
					case "ArrayOfint":
						value = new Array<number>();
						for (var i = 0; i < child.childNodes.length; i++)
							value.push(+child.childNodes[i].textContent);
						break;
					case "OrganizationResponseCollection":
						var responses: InternalResponse[] = [];
						for (var i = 0; i < child.childNodes.length; i++) {
							var item = new InternalResponse();
							var executeResponseItem = child.childNodes[i];	// c:ExecuteMultipleItem
							for (var j = 0; j < executeResponseItem.childNodes.length; j++) {
								let responseChild = executeResponseItem.childNodes[j];
								if (responseChild.localName === "Fault")
									item.fault = responseChild.textContent ? new Resco.Data.WebService.SoapException(responseChild.textContent, 500, "") : null;	//FIXME: parse textContent to get code and details of the exception
								else if (responseChild.localName === "RequestIndex")
									item.requestIndex = Resco.strictParseInt(responseChild.textContent);
								else if (responseChild.localName === "Response") {
									for (var k = 0; k < responseChild.childNodes.length; k++) {
										var responseItem = responseChild.childNodes[k];
										if (responseItem.localName === "ResponseName")
											item.name = responseItem.textContent;
										else if (responseItem.localName === "Results")
											this.deserialize(responseItem, item);
									}
								}
							}
							responses.push(item);
						}
						value = responses;
						break;
					default:
						value = "UnknownValue " + valueType;
						break;
				}
			}
			return value;
		}
		private _getXmlAttribute(parent: Node, localName: string): string {
			return Resco.Data.Xml.getAttribute(parent, localName);
		}


		public serialize(localName: string, dictionary: Resco.Dictionary<string, any>): string {
			var result = "<" + localName + ">"

			dictionary.forEach(kv => {
				result += "<b:KeyValuePairOfstringanyType><c:key>" + kv.key + "</c:key><c:value " + this._writeXmlDictionaryValue(kv.value) + "</c:value></b:KeyValuePairOfstringanyType>";
			}, this);

			result += "</" + localName + ">";
			return result;
		}

		private _writeXmlDictionaryValue(value: any): string {
			var result: string;

			if (value === null || value === undefined) {
				return "xsi:nil=\"true\">";
			}
			if (typeof value === "string") {
				return "xsi:type=\"xsd:string\">" + value.encodeXML();
			}
			if (typeof value === "boolean") {
				return "xsi:type=\"xsd:boolean\">" + (value ? "true" : "false");
			}
			if (typeof value === "number") {
				return "xsi:type=\"xsd:double\">" + value.toString();
			}
			if (value instanceof Integer) {
				return "xsi:type=\"xsd:int\">" + value.Value.toString();
			}
			if (value instanceof Decimal) {
				return "xsi:type=\"xsd:decimal\">" + value.toString();
			}
			if (value instanceof Date) {
				return "xsi:type=\"xsd:dateTime\">" + value.toISOString();
			}
			if (value instanceof Guid) {
				return "xsi:type=\"s:guid\">" + value.toString();
			}
			// TODO: d:base64Binary
			if (EntityReference.as(value)) {
				var ref = <EntityReference>value;
				return "xsi:type=\"b:EntityReference\"><b:Id>" + ref.Id + "</b:Id><b:LogicalName>" + ref.LogicalName + "</b:LogicalName><b:Name xsi:nil=\"true\" />";
			}
			if ((Object.prototype.toString.call(value) === '[object Array]') && (<Array<any>>value).every(item => item instanceof CrmEntity2011)) {
				result = "xsi:type=\"b:EntityCollection\"><b:Entities>";

				(<Array<CrmEntity2011>>value).forEach(entity => {
					result += "<b:Entity>" + this._writeXmlEntity(entity) + "</b:Entity>"
				}, this);

				return result + "</b:Entities>";
			}
			if (value instanceof OptionSetValue) {
				var optValue = value.Value;
				if (this.sendPicklistNull && optValue === -1)
					return "xsi:nil=\"true\">";
				else
					return "xsi:type=\"b:OptionSetValue\"><b:Value>" + optValue.toString() + "</b:Value>";
			}
			if (value instanceof CrmNull) {
				return "xsi:nil=\"true\">";
			}
			if (value instanceof CrmMoney) {
				return "xsi:type=\"b:Money\"><b:Value>" + value.Value + "</b:Value>"
			}
			if (value instanceof EntityReference) {
				return "xsi:type=\"b:EntityReference\"><b:Id>" + value.Id + "</b:Id><b:LogicalName>" + value.LogicalName + "</b:LogicalName><b:Name xsi:nil=\"true\" />";
			}
			if ((Object.prototype.toString.call(value) === '[object Array]') && (<Array<any>>value).every(item => item instanceof EntityReference)) {
				result = "xsi:type=\"b:EntityReferenceCollection\">";

				(<Array<EntityReference>>value).forEach(entity => {
					result += "<b:EntityReference>" + this._writeXmlDictionaryValue(entity) + "</b:EntityReference>"
				}, this);

				return result + "</b:EntityReferenceCollection>";
			}
			if (value instanceof CrmEntity2011) {
				return "xsi:type=\"b:Entity\">" + this._writeXmlEntity(value);
			}
			if (value instanceof Relationship) {
				result = "xsi:type=\"b:Relationship\">";

				if (value.primaryEntityRole)
					result += "<b:PrimaryEntityRole>" + value.primaryEntityRole + "</b:PrimaryEntityRole>";

				result += "<b:SchemaName>" + value.schemaName + "</b:SchemaName>";
				return result;
			}
			// TODO: EntityFilters
			if (value instanceof ColumnSet) {
				result = "xsi:type=\"b:ColumnSet\"><AllColumns>" + (value.allColumns ? "true" : "false") + "</AllColumns><Columns xmlns:array=\"http://schemas.microsoft.com/2003/10/Serialization/Arrays\">";
				if (value.columns)
					value.columns.forEach(col => result += "<array:string>" + col + "</array:string>", this);

				result += "</Columns>"
				return result;
			}
			if (value instanceof TargetFieldType) {
				return "xmlns:crm=\"http://schemas.microsoft.com/crm/2011/Contracts\" xsi:type=\"crm:TargetFieldType\">" + value.toString();
			}
			return ">";
		}

		private _writeXmlEntity(entity: CrmEntity2011): string {
			return this.serialize("b:Attributes", entity) + "<b:EntityState xsi:nil=\"true\" /><b:LogicalName>" + entity.logicalName + "</b:LogicalName>"
		}
	}
}