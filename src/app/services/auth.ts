import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn:'root'
})
export class Auth{
  private apiUrl='http://localhost:8080/api/auth';

  constructor(private http:HttpClient){}

  signup(data:{fullName:string;email:string;password:string}):Observable<any>{
    return this.http.post(`${this.apiUrl}/signup`,data);
  }

  login(data:{email:string;password:string}):Observable<any>{
    return this.http.post(`${this.apiUrl}/login`,data);
  }
}