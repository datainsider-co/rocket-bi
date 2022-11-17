# GOAL

In this guide, you will install and build a simple dashboard using Rocket.BI.
This is the dashboard:
<img width="800" alt="github_rocketbi2" src="https://user-images.githubusercontent.com/91059979/194797668-65eabfb2-9bfb-447f-be24-846b8c797829.gif">

You can checkout [the Dashboard via this link.](https://demo.rocket.bi/dashboard/sales-dashboard-7?token=7eecf750-cbde-4c53-8fa8-8b905fec667e)

## INSTALL

Before we go deeper in create an advance dashboard with Rocket.BI, making sure you have rocket.bi platform on your ClickHouse server and the data is connected & up-to-date. Here are the step by step guide on the configuration:

Follow the guide here: [Rocket.BI Readme](https://github.com/datainsider-co/rocket-bi/blob/main/README.md)


## LET'S BUILD THE DASHBOARD

In Dashboard, you will find your reportings, start visualization by clicking +New
You can build **unlimited dashboards** & draw **unlimited charts** in a dashboard.

<img width="800" alt="rocketbi_create_chart" src="https://user-images.githubusercontent.com/91059979/194799689-3ad88958-b7a8-4b3f-a98d-7af8b198d684.gif">
See hi-res tutorial on Youtube: https://www.youtube.com/watch?v=TMkdMHHfvqY

### Build the Chart Controls

#### Create a Metrics Control
In the Tab filter, select metric fields you want to use. Make sure to keep check on aggregation setting.
<img width="650" alt="rocketbi_chart_6" src="https://user-images.githubusercontent.com/91059979/194493404-dd6199bc-2faf-4a73-b72e-a6370dc490f8.png">

Rename filters & Save Control to Dashboard <img width="400" alt="Metrics Control" src="https://user-images.githubusercontent.com/91059979/194493738-c085fa53-173b-495a-b654-bffcd092b2e6.png">


#### Create a Date Type Control
Choose a Date field as Main Date column:

<img width="650" alt="rocketbi_chart_4" src="https://user-images.githubusercontent.com/91059979/194491853-dfde6481-3700-4636-9986-a35225b71bb0.png">

Add duplicate variants with different lookup ranges. For example, Year, Monthly, Daily date or Day of Week.

<img width="650" alt="rocketbi_chart_5" src="https://user-images.githubusercontent.com/91059979/194492541-f912b16a-9eb0-43fd-a905-2ce42d97e995.png">

Rename filters & Save Control to Dashboard

<img width="200" alt="Date Range Control" src="https://user-images.githubusercontent.com/91059979/194494006-2285e434-3e5b-4160-9886-bc1d1e9980a7.png">
