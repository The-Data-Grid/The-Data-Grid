<p align="center"><a href="https://www.thedatagrid.org"><img alt="The Data Grid Logo" width="350px" src="https://www.thedatagrid.org/assets/logo.png" /></a></p>  

---  

<p align="center"><a href="https://www.thedatagrid.org"><b>www.thedatagrid.org</b></a></p>  

> **The Data Grid is a free and open source database creation, data collection, and data management platform for environmental auditing.** 

## Introduction  

The platform allows organizations to upload their data to their database, manage auditors, and view the data they have uploaded. This way, environmental data can be easily standardized within and across organizations. 


## How it works

The Data Grid provides a way to represent and manage arbitrary data in a standardized way. It is designed to be flexible enough for many different applications, a core part of the functionality being that any data format can be represented and used. This is implemented by allowing the user to generate their own database schema based on their own requirements using our universal data representation format. The user can then use The Data Grid to upload, update, and delete data according to their schema, perform complex queries on that data, and manage their organization.

### Design Goals

- Fully Custom
  - **Dynamic Representation:** minimal limitations that would prevent a user from representing a specific data format, should be able to represent *any* data format.
  - **Intuitive:** types are intuitive and simple to use.
- Standardized
  - **Dynamic Validation:** makes sure all operations are legal given the schema that the user has provided.
- Minimal Data Duplication
  - **Prophylaxis:** types are implemented such that data duplication does not arise naturally.
  - **Database:** prevents duplication with a highly normalized relational database.

[Read more about the data representation model](https://github.com/The-Data-Grid/The-Data-Grid/blob/master/TDG-INTRO.md#tdg-data-representation-model)

## Mission  
> **To allow communities to monitor and analyze their resource usage easily and at no cost**  

## History and Motivation  

In academic year 2018-2019, student facility auditing organizations at UCLA, led by Bruin Home Solutions came together to form the Bruin Audit Partnership.  

It was determined the facility audit data produced by student organizations on campus were lacking standardization, centralization, and supporting documentation. Data was being lost and could not be aggregated across organizations. Documentation data collection procedures were missing, calling into question the accuracy of the data and diluting its ability to drive policy. There were missed opportunities for these organizations to work together to share best practices, coordinate outreach/recruitment, and develop comprehensive solutions for improving campus. A common platform.  

The goal was to form a coordinated and united push to develop an impartial full picture of campus resource usage, identify areas of improvement, and drive change through UCLA Facilities Management. It was quickly determined that we needed a shared centralized system that continues to maintain the independence and diversity of each organization's unique strengths. Bruin Home Solutions formed a team to develop the software that became The Data Grid. 
