public class Main {
  public static void main(String[] args) throws Exception {
    import java.util.Scanner;
    public class SumOfTwoNumbers {
       public static void main(String[] args) {
           // Create a Scanner object for user input
           Scanner scanner = new Scanner(System.in);
           // Prompt the user to enter two numbers
           System.out.print("Enter the first number: ");
           int num1 = scanner.nextInt();
           System.out.print("Enter the second number: ");
           int num2 = scanner.nextInt();
           // Calculate the sum
           int sum = num1 + num2;
           // Display the result
           System.out.println("The sum of " + num1 + " and " + num2 + " is: " + sum);
       }
    }
  }
}