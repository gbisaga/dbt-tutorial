import * as cdk from 'aws-cdk-lib';
import * as dbt from 'cdk-dbt-lib';

/**
 * A sample stack for what CDK-dbt might look like.
 */
export class JaffleModelStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      const stg_customers = new dbt.Model(this, 'StgCustomers', {
        sql: dbt.fileRef('../models/stg_customers.sql'),
          description: `
            One record per customer.
            You can use *markdown* or external doc block refs.
          `,
          columns: [{
            name: "customer_id",
            description: "primary key of model",
            tests: [ "unique", "not_null" ]
          },{
            name: "first_order_date",
            description: "This model cleans up customer data"
          }]
      });

      const stg_orders = new dbt.Model(this, 'StgOrders', {
        sql: dbt.fileRef('../models/stg_orders.sql'),
        description: 'blah blah'
      });

      const customers = new dbt.Model(this, 'Customers', {
          materialized: 'table',
          sql: `
          with customers as (
              select * from ${dbt.modelRef('stg_customers') }
          ),
          orders as (
            select * from ${dbt.modelRef('stg_orders') }
          ),
          customer_orders as (
              select
                  customer_id,
          
                  min(order_date) as first_order_date,
                  max(order_date) as most_recent_order_date,
                  count(order_id) as number_of_orders
              from orders
              group by 1
          ),
          final as (
              select
                  customers.customer_id,
                  customers.first_name,
                  customers.last_name,
                  customer_orders.first_order_date,
                  customer_orders.most_recent_order_date,
                  coalesce(customer_orders.number_of_orders, 0) as number_of_orders
              from customers
              left join customer_orders using (customer_id)
          )
          select * from final`
      });
    }
}