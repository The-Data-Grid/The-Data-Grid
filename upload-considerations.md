## Upload considerations

Both item upload and observation upload must get the primary keys of other items. For **item upload**, the primary keys of all of the required items must be obtained. For **observation upload**, the primary key of the observed item must be obtained. This is done by the user through the use of dropdowns which is implemented by using the `/item` and `/item/dropdown` endpoints.

### Frontend observation upload logic:

1. query `/item/dropdown` to get dropdowns with the correct primary keys

2. when user selects one, re query `/item/dropdown` while filtering by what the user selects to get the updated dropdowns
3. repeat step 2 until `/item/dropdown` returns length 1 arrays for all values
4. query `/item` with the previous filters to get the primary key of the item
5. send primary key with observation data when uploading observation

### Frontend item upload logic:

1. for every required item in item:
   1. query `/item/dropdown` to get dropdowns with the correct primary keys
   2. when user selects one, re query `/item/dropdown` while filtering by what the user selects to get the updated dropdowns
   3. repeat step 2 until `/item/dropdown` returns length 1 arrays for all values
   4. query `/item` with the previous filters to get the primary key of the item
2. use required item primary keys when uploading item



### Returnables

The returnables that must be gotten to identify each item are all the `item-id` returnables in that item's requirement tree. 

Some things:

- Does frontend know which returnables in the tree are `item-id`? 
- returnables are only generated for features, so we can only upload feature items with the frontend ui rn



































