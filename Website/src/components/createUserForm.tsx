import { useState } from "react";
import type { FormEvent } from "react";

export default function CreateUserForm() {
  const [responseMessage, setResponseMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const response = await fetch("/api/createUser", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.message) {
      setResponseMessage(data.message);
    }
  }

  return (
    <form onSubmit={submit}>
      <label>
        Email: <input type="email" name="email" required />
      </label>
      <br />
      <label>
        Username: <input type="text" name="username" required />
      </label>
      <br />
      <label>
        Password: <input type="password" name="password" required />
      </label>
      <br />
      <button>Create User</button>
      {responseMessage && <p>{responseMessage}</p>}
    </form>
  );
}
