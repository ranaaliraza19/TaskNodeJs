# NodeJsTask Instructions:
- Follow MVC architecture.
- Set global middleware for handling errors.
- Use mongodb for data storing
- Use cloundanry for image storing
 ### Add Validation like:
- Passwords should be 8 characters long, having numbers, characters and atleast one symbol.
- Passwords should be saved in hash form.
- Email should be valid.
### Authentication mechanism:
- authentication by email and password
- Show proper errors message by response, if error exists.
- Use JWT token for authentication.
- JWT token valid for 1 day.
### Functionality:
- Implement CRUD operations for a resource called "products".
- Each product should have the following fields: name, price, description, quantity, and an image.
- Implement validation for the product fields:

# Run Project (how to run project):
we will run this project by running following command in user-app and then test the API on postman/thunder etc by adding routes.
 ```
 npm install
 ```
 ```
 npm start
 ```

