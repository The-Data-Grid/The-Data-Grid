import { IDropdownSettings } from 'ng-multiselect-dropdown';

export let SearchableDropdownSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'item_id',
    textField: 'item_text',
    closeDropDownOnSelection: true,
    allowSearchFilter: true
};
export let ChecklistDropdownSettings: IDropdownSettings = {
    enableCheckAll: true,
    idField: 'item_id',
    textField: 'item_text',
    allowSearchFilter: true
};
export let SearchableChecklistDropdownSettings: IDropdownSettings = {
    enableCheckAll: true,
    idField: 'item_id',
    textField: 'item_text',
    allowSearchFilter: true
};
export let FakeData = [
    { item_id: 1, item_text: 'Mumbai' },
    { item_id: 2, item_text: 'Bangaluru' },
    { item_id: 3, item_text: 'Pune' },
    { item_id: 4, item_text: 'Navsari' },
    { item_id: 5, item_text: 'New Delhi' }
  ];