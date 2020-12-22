# The Data Grid as an open resource

This document discusses the capabilities of TDG’s architecture, including how data is represented as well as how TDG functions as a software platform. It is intended for auditors and admins who wish to understand how their data is represented, as well as for those new to TDG who would like to learn more about its capabilities. This document does not describe how to use [thedatagrid.org](http://thedatagrid.org/), but rather its underlying functionality. [thedatagrid.org](http://thedatagrid.org/) implements the described capabilities, so one does not need to read this document to use its contents.

---

### Table of Contents

1. [Introduction](#introduction)
   1. [Overview](#overview)
   2. [Design Goals](#design-goals)
   3. [Scope](#scope)
   
2. [TDG data representation model](#tdg-data-representation-model)
   1. [Overview](#overview-1)
   2. [Abstract Data Type Prototypes](#abstract-data-type-prototypes)
   3. [Complexities](#complexities)
   4. [Creating a new schema](#creating-a-new-schema)

3. [Data Management](#data-management)
   1. [Query](#query)
   2. [Insert, Update, and Delete](#insert-update-and-delete)


---



## Introduction

### Overview

The overarching goal of The Data Grid software suite is to provide a way to represent and manage arbitrary data in a standardized way. It is designed to be flexible enough for many different applications, a core part of the functionality being that any data format can be represented and used. This is implemented by allowing the user to generate their own database schema based on their own requirements. The user can then use the software to upload, update, and delete data according to their schema, and perform somewhat complex queries on that data.

Creating software which generalizes the format in which one persists data is difficult because everyone has a different way of abstracting their data format. We define several [abstract data type](https://en.wikipedia.org/wiki/Abstract_data_type) (**ADT**) prototypes which are used to describe arbitrary data at a high level, and collectively form the data representation model. New schemas are created by creating custom ADTs from the prototypes. The data management operations partially define the ADTs in the model, and this document will detail them from that perspective. These operations are performed via a RESTful API, which is described in the API Design Spec.

### Design Goals

- Fully Custom
  - **Dynamic Representation:** minimal limitations that would prevent a user from representing a specific data format, should be able to represent *any* data format.
  - **Intuitive:** types are intuitive and simple to use.
- Standardized
  - **Dynamic Validation:** makes sure all operations are legal given the schema that the user has provided.
- Minimal Data Duplication
  - **Prophylaxis:** types are implemented such that data duplication does not arise naturally.
  - **Database:** prevents duplication with a highly normalized relational database.

### Scope

The Data Grid has a data representation model and an application which implements said model and allows its use via a [website](thedatagrid.org). The model is also used by TDG to implement custom solutions for specific clients. This document discusses only the model itself and not its implementation. Although PostgreSQL and JavaScript examples are given, the model is meant to be generalizable across languages and environments. We present the model as a high level standard for representing arbitrary data. 



## TDG Data Representation Model

### Overview

This section gives a high level understanding of the model without delving into too much technicality. Like we said in the introduction, all data that is represented by TDG uses the data representation model, which is a collection of ADTs. The model contains three ADT prototypes which themselves contain relevant subtypes. Note the use of the word *prototype*; each is a *prototype of a user defined abstract data type, instead of being an abstract data type itself*. In other words, a user can create custom ADTs by modifying one of the ADT prototypes. 

**Items** are generic objects with data associated with them. There are multiple **item prototype types**, and an item of the *observable* type is referred to as a **feature.** All features are items, but because there are other item types, not all items are features. Features represent physical entities that can be observed. Feature data that does not change is related to the **feature** itself, while data that is observational and may change over different observations of the same **feature** is related to that feature's **observation**. There is a one to many relationship between a feature and its observations, since a feature can be observed many times. Data is stored within **data columns** that are related to an observation or feature. Custom schemas are represented by constructing **item** types, constructing **data column** types, and relating them. 

Together, **items** and **observations** create an *observation-based model*. Data is recorded by *observing* existing items. Although, if one wanted to record a list of items which are not individually observed, that would also be completely fine. The user would simply create new items, and not create new observations related to those items. 

*Note: In saying that we implement an observation-based model, we do not mean that only observational data can be represented! All this means is that the source which is observed must be defined before an observation of it is recorded. In an experimental setting this would be achieved by simply defining the experimental data type before recording observations of it.*

### Abstract Data Type Prototypes

------

### `item`

A type which represents an arbitrary structure that may have data associated with it. Often it represents a physical entity that can be observed. Each instance of an **`item`** ADT represents a single structure, and must be uniquely identified to be instantiated. 

**Requirements**

1. Must be uniquely identifiable by data columns within it, or data columns within it's item requirement tree 
2. All **`data column`** ADTs in the array must have an *item related* reference type

**Properties**

1. **Display Name:** Name of ADT. Should refer to a single instance of the ADT, and thus is likely not plural.

2. **Any required `item` ADTs:** Shows that another item is related to this item. Each item requirement itself has properties:

   1. **Identifying:** Is this relationship needed to identify the base item?
   2. **Nullable:** Is this relationship allowed to not exist?

3. **Item prototype type:** One of three values which determines how the item works with the other ADTs

   | Item Prototype Type Name | Description                                                  |
   | ------------------------ | ------------------------------------------------------------ |
   | `observable`             | Contains a ground truth location and an accompanying observation ADT. |
   | `potential observable`   | Contains a ground truth location but not an accompanying observation ADT. Can always be converted into `observable` type by adding an observation ADT. |
   | `non-observable`         | Does not contain a ground truth location or an accompanying observation ADT. |

4. **Ground truth location:** The data column which contains the most accurate geographic location of the item. This must be a data column within either this item itself, or another item within this item's item requirement tree. The data column must also be of reference type `item-location`.

5. **An array of `data column` ADTs:** Any length.

**Operations**

1. Create instances of this ADT
2. Delete instances of this ADT
3. Return **`data column`** ADTs within this item's item requirement tree
4. Return values from data columns within this item's item requirement tree
5. Return distinct values from data columns within this item's item requirement tree
6. Change this item's `attribute` reference type data columns
7. Mutate the array of **`data column`** ADTs in this ADT 

**Existence**

**`item`** ADTs of `potential observable` and `non-observable` prototype type must be prespecified in the database to be included. Examples of this are items which multiple schemas may want to reference, or items which are needed for business logic outside of custom schemas. Custom **`item`** ADTs of `observable` prototype type may be created by the user by starting with the **`item`** ADT prototype, fulfilling its requirements, and customizing its properties. 

------

### `observation`

A type whose domain is the observations of a specific instance of an **`item`** ADT. Each instance is an observation of an **`item`** ADT instance. 

 **Requirements**

1. Must be associated with an **`item`** ADT, and must be the only **`observation`** ADT associated with it.
2. Instances must have a many to one relationship with instances of its accompanying item.
3. All **`data column`** ADTs in the array must have an *observation related* reference type

**Properties**

1. **The associated `item` ADT:** The item that is observed 
2. **An array of `data column` ADTs:** Any length.

**Operations**

1. Create instances of this ADT
2. Delete instances of this ADT
3. Return **`data column`** ADTs within this observation's array
4. Return values from data columns within this observation
5. Return distinct values from data columns within this observation
6. Change this observation's `attribute` reference type data columns
7. Mutate the array of **`data column`** ADTs in this ADT 

**Existence**

**`observation`** ADTs are always created internally, never by the user. When a new **`item`** ADT is created of the `observable` prototype type, an accompanying **`observation`** ADT is automatically created with it. 

------

### `data column`

A type which represents an arbitrary piece of information about an **`item`** ADT. May be observational, static, or both. Identity is dependent on many properties which define the ADT. Each instance represents an entire array of values which spans over multiple **`item`** and **`observation`** ADTs, depending on the reference type. Thus, each ADT may only be instantiated once. 

**Requirements**

1. May only be instantiated once per ADT. 

**Properties**

1. **Display Name:** Name of **`data column`** ADT. Should refer to a single value within the **`data column`** ADT's array of values, and thus is likely not plural.

2. **Internal Data Type:** The data type which the values of the data column take on. Native to the database system being used. In our case these are PostgreSQL types.

   | Internal Data Type (PostgreSQL Type) Name                    |
   | ------------------------------------------------------------ |
   | [`TEXT`](https://www.postgresql.org/docs/12/datatype-character.html) |
   | [`NUMERIC`](https://www.postgresql.org/docs/12/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL) |
   | [`INTEGER`](https://www.postgresql.org/docs/12/datatype-numeric.html#DATATYPE-INT) |
   | [`TIMESTAMPTZ`](https://www.postgresql.org/docs/12/datatype-datetime.html#DATATYPE-DATETIME-INPUT) |
   | [`BOOLEAN`](https://www.postgresql.org/docs/12/datatype-boolean.html) |
   | [`JSON`](https://www.postgresql.org/docs/12/datatype-json.html) |
   | [`Point`](https://postgis.net/docs/reference.html)           |
   | [`LineString`](https://postgis.net/docs/reference.html)      |
   | [`Polygon`](https://postgis.net/docs/reference.html)         |

3. **Array of values with the internal data type:** The actual data which the column contains. Starts empty.

4. **Default:** Should this column be returned by default?

5. **Nullable:** Can this ADT's array of values contain NULLs?

6. **Filter Selector Type:** The selector that should be used when filtering by this data column.

   | Selector Type Name            | Description                                                  |
   | ----------------------------- | ------------------------------------------------------------ |
   | `numericChoice`               | Number with operation: `≤`, `<`, `≥`, `>`, `=`               |
   | `numericEqual`                | Any number                                                   |
   | `calendarRange`               | Range between two dates                                      |
   | `calendarEqual`               | Exact date                                                   |
   | `dropdown`                    | Select one from distinct set of current values of data column |
   | `searchableDropdown`          | Search and select one from distinct set of current values of data column |
   | `checklistDropdown`           | Select any from distinct set of current values of data column |
   | `searchableChecklistDropdown` | Search and select any from distinct set of current values of data column |
   | `text`                        | Any text                                                     |
   | `bool`                        | Select one from `True` or `False`                            |

7. **Input Selector Type:** The selector that should be used when inputting data into this data column (Uses same types as Filter Selector Type).

8. **Display Type:** The type to display as. We include the accompanying JavaScript type.

   | Display Type Name | Description                        | JavaScript Type  |
   | ----------------- | ---------------------------------- | ---------------- |
   | `string`          | String display                     | String           |
   | `date`            | Date in form of MM-DD-YYYY         | Date             |
   | `hyperlink`       | When clicked open link in new page | Object (to JSON) |
   | `bool`            | Display 'True' or 'False'          | Boolean          |
   | `location`        | GeoJSON                            | Object (to JSON) |

9. **Reference Type:** The relationship that this **`data column`** ADT has with the **`item`** ADT that contains it. There are three sections of reference types: *observation related*, *item related*, and *special*. This is what determines whether the data column is observational, or static to its item. 

   ​		***Item Related***

   | Reference Type Name | Description                                                  |
   | ------------------- | ------------------------------------------------------------ |
   | `item-id`           | Data field that has a one-to-one relationship with the item and is used to either uniquely identify the item by itself, or is part of a composite key that uniquely identifies the item. This means that it can only take on one value per item and is not nullable |
   | `item-non-id`       | Data field that has a one-to-one relationship with the item. This means that it can only take on one value per item. |
   | `item-list`         | Data field that has a many-to-one relationship with the item. This means that it can take an arbitrary number of values per item. The possible values are predefined. We use the terminology **list** for this type of representation. |
   | `item-location`     | Data field that has a one-to-one relationship with the item and can only take on a geographic location of point, region, or path. |
   | `item-factor`       | Data field that has a one-to-one relationship with the item and has predefined possible values. Should be used for a categorical data type. Can only take on one value per item. We use the terminology **factor** for this type of representation |

   ​		***Observation Related***

   | Reference Type Name | Description                                                  |
   | ------------------- | ------------------------------------------------------------ |
   | `obs`               | Data field that has a one-to-one relationship with the observation. This means that it can only take on one value per observation. |
   | `obs-global`        | Data field that has a one-to-one relationship with the observation and is defined for all observations. This means that it can only take on one value per observation. |
   | `obs-list`          | Data field that has a many-to-one relationship with the observation. This means that it can take an arbitrary number of values per observation. The possible values are predefined. We use the terminology **list** for this type of representation. |
   | `obs-factor`        | Data field that has a one-to-one relationship with the observation and has predefined possible values. Should be used for a categorical data type. Can only take on one value per item. We use the terminology **factor** for this type of representation. |

   ​		***Special***

   | Reference Type Name | Description                                                  |
   | ------------------- | ------------------------------------------------------------ |
   | `attribute`         | Data field that has a one-to-one relationship with the observation and the item at the same time and has predefined possible values. This is used for fields that can change over different observations, but do so very rarely. This way there is an observed value that is referenced by the observation and a current value that is referenced by the item. Can only take on one value per observation and item. We use the terminology **attribute** for this type of representation. |

**Operations**

1. Create one instance of this ADT
2. Append values to this ADT's array of values
3. Remove values from this ADT's array of values
4. Return values from this ADT's array of values
5. Return distinct values from this ADT's array of values

**Existence**

May be prespecified in the database and included by prespecified **`item`** ADTs. Custom **`data column`** ADTs may be created by the user by starting with the **`data column`** ADT prototype, fulfilling its requirements, and customizing its properties. 

------

### Complexities

**Item Requirement Tree:** The item requirement tree adds complexity because the identity of a value within a data column depends not only on the column itself, but which item requirement tree it falls in. Thus, by referring to a data column by its returnable ID instead of its column ID, we get only a subset of its values depending on the root item and where the data column falls within the tree. This is an abstraction of the concept of joining on foreign key constraints in relational databases. 

**Note for developers:** In this specification the **`item`** and **`observation`** ADTs reference the **`data column`** ADTs that they include, but this does not force a developer who is implementing the standard to create the **`data column`** ADTs first! We include **`item`** and **`observation`** operations which mutate their **`data column`** array with this in mind. In this case the developer can first create the **`item`** and **`observation`** ADTs with empty **`data column`** arrays, then create the relevant **`data column`** ADTs, and then mutate the initially created **`item`** and **`observation`** ADTs to include the newly created **`data column`** ADTs.

### Creating a new schema

As stated previously, only the **`item`** and **`data column`** abstract data types can be created by the user. In addition, user created item types must be of item prototype type `observable`. Specification of properties, creation of a new schema, and management of existing schemas must be done programmatically, and is outside the scope of this document. See the backend documentation. 



## Data Management

*Note: this section uses syntax introduced in the previous section*

### Query

You have spent all this time to create a custom schema and upload your data, you would hope that you can look at it too! You can query both **items** and **observations** and return their data in a spreadsheet-like format. Although both item and observation queries must be specific to a single item type, that does not mean that they cannot return information about other items. Querying observations of an item that has required items can return data from all of the items in the item requirement tree. For example, if a park ranger is querying observations from park benches, surely she wants to not only get the bench data, but also the data from the park which the bench is in. Thus, the query operation for a specific item type is dependent upon that item's required items, those items' required items, and so on. 

There are two main query types, which were described as operations for **`item`** and **`observation`** ADTs:

| ADT Prototype     | Query Type | Description                                                  |
| ----------------- | ---------- | ------------------------------------------------------------ |
| **`item`**        | Data       | Get specified **`data column`** array values associated with a specific **`item`**, may be filtered by custom input and specified **`data columns`**, may be sorted by custom input and specified **`data columns`**. Rows in output correspond to **`item`** instances. Columns in output correspond to **`data columns`**. All columns have the same length. |
| **`observation`** | Data       | Get specified **`data column`** array values associated with a specific **`observation`**, may be filtered by custom input and specified **`data columns`**, may be sorted by custom input and specified **`data columns`**. Rows in output correspond to **`observation`** instances. Columns in output correspond to **`data columns`**. All columns have the same length. |
| **`item`**        | Distinct   | Perform the data query, and then return the distinct values of each requested **`data column`**. Columns may have different lengths. |
| **`observation`** | Distinct   | Perform the data query, and then return the distinct values of each requested **`data column`**. Columns may have different lengths. |



### Insert, Update, and Delete

TODO:

- Insert, Update, and Delete
- More about features
- Touch on subfeatures
- Revise Item Requirement Tree section
- Rework Complexities section?
- I wanted this to be high level enough so that anyone could read and understand it, but I think it's too technical right now. The capabilities need to be further abstracted from the model, so one does not need to read the entire model definition to understand them. Maybe we formalize the model definition and bring it into a different technical document. Not sure.



---


