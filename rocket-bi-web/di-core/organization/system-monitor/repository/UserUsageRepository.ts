import { ListingRequest, ListingResponse } from '@core/common/domain';
import { QueryExecutionLog } from '@core/organization';
import { TimeoutUtils } from '@/utils';

export abstract class UserUsageRepository {
  abstract search(request: ListingRequest): Promise<ListingResponse<QueryExecutionLog>>;
}

export class MockUserUsageRepository implements UserUsageRepository {
  async search(request: ListingRequest): Promise<ListingResponse<QueryExecutionLog>> {
    await TimeoutUtils.sleep(1000);
    return Promise.resolve(
      new ListingResponse(
        [
          {
            query: "SELECT user_id, COUNT(login_id) FROM logins WHERE date >= '2024-07-15' GROUP BY user_id;",
            owner: {
              username: 'user1@example.com',
              fullName: 'John Doe'
            },
            cost: 0.009,
            createdAt: 1692323564000
          },
          {
            query: "SELECT product_id, SUM(discount) FROM discounts WHERE date BETWEEN '2024-08-01' AND '2024-08-15' GROUP BY product_id;",
            owner: {
              username: 'user2@example.com',
              fullName: 'Jane Smith'
            },
            cost: 0.01,
            createdAt: 1692454763000
          },
          {
            query: "SELECT COUNT(user_id) FROM users WHERE country = 'USA' AND signup_date > '2024-07-20';",
            owner: {
              username: 'user3@example.com',
              fullName: 'Alice Johnson'
            },
            cost: 0.008,
            createdAt: 1692670366000
          },
          {
            query: "SELECT AVG(order_value) FROM orders WHERE status = 'shipped' AND date >= '2024-08-01';",
            owner: {
              username: 'user4@example.com',
              fullName: 'Bob Lee'
            },
            cost: 0.014,
            createdAt: 1692395567000
          },
          {
            query: "SELECT region, COUNT(order_id) FROM orders WHERE date > '2024-07-25' GROUP BY region;",
            owner: {
              username: 'user5@example.com',
              fullName: 'Charlie Kim'
            },
            cost: 0.012,
            createdAt: 1692707968000
          },
          {
            query: "SELECT COUNT(session_id) FROM sessions WHERE end_time IS NOT NULL AND date >= '2024-08-01';",
            owner: {
              username: 'user6@example.com',
              fullName: 'David Brown'
            },
            cost: 0.007,
            createdAt: 1692557161000
          },
          {
            query: "SELECT SUM(amount) FROM refunds WHERE status = 'processed' AND date > '2024-08-05';",
            owner: {
              username: 'user7@example.com',
              fullName: 'Emily Davis'
            },
            cost: 0.013,
            createdAt: 1692632364000
          },
          {
            query: "SELECT country, COUNT(user_id) FROM users WHERE status = 'inactive' GROUP BY country;",
            owner: {
              username: 'user8@example.com',
              fullName: 'Frank Miller'
            },
            cost: 0.011,
            createdAt: 1692475962000
          },
          {
            query: "SELECT product_id, COUNT(wishlist_id) FROM wishlists WHERE date >= '2024-08-01' GROUP BY product_id;",
            owner: {
              username: 'user9@example.com',
              fullName: 'Grace Wilson'
            },
            cost: 0.01,
            createdAt: 1692681965000
          },
          {
            query: "SELECT region, AVG(complaint_resolution_time) FROM customer_service WHERE date BETWEEN '2024-07-20' AND '2024-08-20' GROUP BY region;",
            owner: {
              username: 'user10@example.com',
              fullName: 'Henry Clark'
            },
            cost: 0.016,
            createdAt: 1692317963000
          }
        ],
        10
      )
    );
  }
}
