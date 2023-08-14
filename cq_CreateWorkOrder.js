import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/ldsUtils';
// importing to get the object info 
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
// importing Account shcema
import WORK_ORDER_OBJECT from '@salesforce/schema/cq_Work_Order__c';

import getSiteInfo from '@salesforce/apex/cqSearchWithClassController.getSiteInfo';
import fieldsToDisplay from '@salesforce/apex/cq_SearchWorkOrderController.fieldsToDisplay';


export default class Cq_CreateWorkOrder extends LightningElement {

    objApiName = 'cq_Work_Order__c';

    @track showSpinner = false;
    @track siteOptions = [];
    @track woOptions = [];
    @track siteSel;
    @track woSelected;
    @track woSelectedLabel;
    @track assignTo;

    @track createWOrecord = false;
    @track fldsToDisp = [];

    @wire(getObjectInfo, { objectApiName: WORK_ORDER_OBJECT })
    woObjectInfo({ data, error }) {
        if (data) {
            let optionsValues = [];
            // map of record type Info
            const rtInfos = data.recordTypeInfos;
            // getting map values
            let rtValues = Object.values(rtInfos);

            for (let i = 0; i < rtValues.length; i++) {
                if (rtValues[i].name !== 'Master') {
                    optionsValues.push({
                        label: rtValues[i].name,
                        value: rtValues[i].recordTypeId
                    })
                }
            }

            this.woOptions = optionsValues;
        }
        else if (error) {
            this.showToastMessage('Error', 'error', reduceErrors(error), 'dismissable');
        }
    }

    connectedCallback() {
        this.siteInfoHandler();
    }

    siteInfoHandler() {
        this.siteOptions = [];
        getSiteInfo()
            .then(data => {
                this.siteSel = data.defSiteId;
                for (const site of data.siteRecList) {
                    const option = {
                        label: site.Name,
                        value: site.Id
                    }
                    this.siteOptions = [...this.siteOptions, option];
                }
                this.showSpinner = false;
            })
            .catch(error => {
                this.showSpinner = false;
                this.showToastMessage('Error', 'error', reduceErrors(error), 'dismissable');
            })
    }

    siteHandler(event) {
        this.siteSel = event.target.value;
    }

    woHandler(event) {
        this.woSelected = event.detail.value;
        this.woSelectedLabel = this.woOptions.reduce((a, v) => a || (v.value == this.woSelected ? v.label : ""), "");
    }

    woCreatehHandler() {

        if (this.woSelected) {
            var fldValList = [];
            this.showSpinner = true;
            fieldsToDisplay({ recType: this.woSelectedLabel })
                .then(data => {
                    console.log('In here');
                    let fldList = data.fieldsToDisp.split(';')
                    for (let i = 0; i < fldList.length; i++) {
                        let fldMap = {};
                        fldMap.FldVal = fldList[i];
                        fldValList.push(fldMap);
                    }

                    this.fldsToDisp = [...fldValList];
                    this.assignTo = data.assignTo;
                    console.log('**', JSON.stringify(this.fldsToDisp));
                    this.createWOrecord = true;
                    this.showSpinner = false;
                })
                .catch(error => {
                    this.showSpinner = false;
                    this.showToastMessage('Error', 'error', reduceErrors(error), 'dismissable');
                })
        }else{
            var errList = [];
            errList.push('Workorder Type is required.');
            this.showToastMessage('Error', 'error', errList, 'dismissable');
        }
    }

    closeModalHandler() {
        this.createWOrecord = false;
    }

    showToastMessage(title, variant, message, mode) {
        const showToastEvt = new ShowToastEvent({
            "title": title,
            "variant": variant,
            "message": message[0],
            "mode": mode
        });
        this.dispatchEvent(showToastEvt);
    }

}