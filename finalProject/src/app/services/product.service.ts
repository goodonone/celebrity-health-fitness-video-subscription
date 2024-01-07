import { Injectable } from '@angular/core';
import { Product } from '../models/product';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseURL : string = "http://localhost:3000/api/product";
  tokenKey : string = "token"

  private sampleProducts: Product[] = [
   
          {
            productId:1,
            productName:"Dumbbell",
            productPrice:20,
            productDescription:"Tumblr man braid vinyl whatever bodega boys, keffiyeh mumblecore yes plz. Unicorn vegan four dollar toast taxidermy, vaporware tote bag tacos distillery vibecession austin messenger bag. Craft beer copper mug next level unicorn. Plaid celiac authentic big mood. Heirloom woke PBR&B seitan, butcher man braid swag banjo. Yes plz hexagon austin unicorn art party godard DSA vaporware. Aesthetic hoodie seitan, retro jawn master cleanse tbh.",
            productUrl:"https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:06:18.000Z”,“updatedAt”:“2023-12-19T11:06:18.000Z"
          },

          {
            productId:2,
            productName:"YogaMat",
            productPrice:30,
            productDescription:"Try-hard whatever skateboard trust fund gochujang pabst pork belly. Poutine gentrify chartreuse yes plz cliche. Mumblecore pug lumbersexual glossier etsy coloring book keytar bespoke. Cornhole hammock bushwick shaman distillery authentic offal green juice everyday carry DIY iPhone flexitarian tacos chambray.",
            productUrl:"https://slack-imgs.com/?c=1&o1=ro&url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1592432678016-e910b452f9a2%3Fblend%3D000000%26blend-alpha%3D10%26blend-mode%3Dnormal%26blend-w%3D1%26crop%3Dfaces%252Cedges%26h%3D630%26mark%3Dhttps%253A%252F%252Fimages.unsplash.com%252Fopengraph%252Flogo.png%26mark-align%3Dtop%252Cleft%26mark-pad%3D50%26mark-w%3D64%26w%3D1200%26auto%3Dformat%26fit%3Dcrop%26q%3D60%26ixid%3DM3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzA0NTkxNTE5fA%26ixlib%3Drb-4.0.3"
          },
          {
            productId:3,
            productName:"Barbell",
            productPrice:50,
            productDescription:"Salvia flexitarian meh, four dollar toast retro hexagon cray pabst before they sold out dreamcatcher microdosing literally. Chillwave VHS tousled trust fund. Gatekeep before they sold out vice kogi bruh fixie man bun austin. Cliche migas VHS disrupt grailed. Forage flannel DIY yes plz, enamel pin vibecession salvia. Readymade prism listicle poutine taiyaki, williamsburg church-key sartorial everyday carry air plant pug.",
            productUrl:"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:19:38.000Z”,“updatedAt”:“2023-12-19T11:19:38.000Z"},
          {
            productId:4,
            productName:"Shirt",
            productPrice:60,
            productDescription:"Occupy keytar kogi fashion axe mustache tote bag ramps gatekeep whatever gastropub shaman. Lo-fi neutral milk hotel locavore retro fam fingerstache. Vice unicorn meh gatekeep, retro bitters shaman neutra polaroid. Seitan iceland try-hard, solarpunk enamel pin godard neutra jianbing. Trust fund schlitz williamsburg yr shoreditch. Health goth church-key wolf yuccie austin fashion axe tbh 90's.",
            productUrl:"https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          },
          {
            productId:5,
            productName:"Top for women",
            productPrice:45,
            productDescription:"Quinoa selfies edison bulb offal YOLO. Mumblecore slow-carb pitchfork banjo, readymade gatekeep 3 wolf moon meggings hell of narwhal poke PBR&B yr blue bottle VHS. Four loko woke microdosing sustainable vinyl. DSA gluten-free butcher, chicharrones semiotics kinfolk blackbird spyplane 3 wolf moon VHS humblebrag gorpcore keytar wayfarers tacos. Vegan bitters beard af, deep v lomo yuccie viral poke pinterest pabst. Cornhole hashtag locavore food truck.",
            productUrl:"https://images.pexels.com/photos/6443532/pexels-photo-6443532.jpeg?auto=compress&cs=tinysrgb&w=800"
          },
          {
            productId:6,
            productName:"Boxing gloves",
            productPrice:35,
            productDescription:"Letterpress seitan lomo kogi. Shaman adaptogen meh coloring book fam, cliche chicharrones. Taxidermy hashtag chartreuse blog austin keffiyeh craft beer godard fit pinterest umami schlitz narwhal tumblr. Pug tilde pitchfork offal, whatever asymmetrical neutral milk hotel gorpcore letterpress skateboard JOMO PBR&B. Migas cupping try-hard adaptogen irony. Seitan tonx flannel, praxis twee drinking vinegar cupping fingerstache pabst jean shorts. Photo booth wolf asymmetrical crucifix, slow-carb hell of shoreditch lo-fi gatekeep thundercats ethical Brooklyn williamsburg cornhole vinyl.",
            productUrl:"https://slack-imgs.com/?c=1&o1=ro&url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1583473848882-f9a5bc7fd2ee%3Fq%3D80%26w%3D3540%26auto%3Dformat%26fit%3Dcrop%26ixlib%3Drb-4.0.3%26ixid%3DM3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%253D%253D"
          },
          {
            productId:7,
            productName:"Small dumbbell",
            productPrice:15,
            productDescription:"Schlitz semiotics forage shaman fanny pack. Intelligentsia VHS kitsch meh fingerstache, fixie fashion axe tilde flannel. Craft beer roof party JOMO, snackwave hexagon cliche humblebrag man bun letterpress biodiesel solarpunk polaroid stumptown waistcoat. Williamsburg wolf dreamcatcher irony kombucha. DSA banh mi post-ironic pickled jawn schlitz 8-bit jean shorts paleo JOMO bushwick polaroid. Pickled locavore vibecession, iceland typewriter viral hella quinoa praxis affogato jean shorts wayfarers vexillologist bushwick listicle. Gochujang literally occupy butcher.",
            productUrl:"https://slack-imgs.com/?c=1&o1=ro&url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1586401100295-7a8096fd231a%3Fblend%3D000000%26blend-alpha%3D10%26blend-mode%3Dnormal%26blend-w%3D1%26crop%3Dfaces%252Cedges%26h%3D630%26mark%3Dhttps%253A%252F%252Fimages.unsplash.com%252Fopengraph%252Flogo.png%26mark-align%3Dtop%252Cleft%26mark-pad%3D50%26mark-w%3D64%26w%3D1200%26auto%3Dformat%26fit%3Dcrop%26q%3D60%26ixid%3DM3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzA0NTkxODU4fA%26ixlib%3Drb-4.0.3"
          },
          {
            productId:8,
            productName:"Leggings",
            productPrice:55,
            productDescription:"Literally iceland green juice solarpunk, next level jawn wayfarers vape direct trade. Ethical live-edge shoreditch, activated charcoal tofu hexagon vegan wayfarers jean shorts squid. Flexitarian wolf mixtape, la croix vexillologist cronut DIY paleo bitters. Prism yuccie bodega boys big mood bitters readymade hella raw denim. Selvage asymmetrical squid food truck narwhal synth banjo pork belly pabst.",
            productUrl:"https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:33:53.000Z”,“updatedAt”:“2023-12-19T11:33:53.000Z"
          },
          {
            productId:9,
            productName:"Battle rope",
            productPrice:70,
            productDescription:"Air plant direct trade ugh slow-carb butcher activated charcoal. PBR&B blackbird spyplane jawn try-hard. Whatever brunch flexitarian church-key. Green juice selfies thundercats chambray keffiyeh shaman JOMO franzen beard intelligentsia plaid jawn marxism. Messenger bag neutra tilde VHS. Mixtape letterpress pinterest jean shorts.",
            productUrl:"https://images.pexels.com/photos/4164762/pexels-photo-4164762.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          },
          {
            productId:10,
            productName:"Medicine Ball",
            productPrice:75,
            productDescription:"Asymmetrical vexillologist authentic trust fund chicharrones iPhone. Chicharrones kitsch williamsburg fixie before they sold out chillwave bruh everyday carry health goth chia iPhone marfa. You probably haven't heard of them big mood seitan, ugh readymade bushwick activated charcoal unicorn. YOLO swag flexitarian iPhone marfa tofu kogi praxis succulents. Lo-fi raw denim selvage, kogi messenger bag organic coloring book mustache praxis farm-to-table. Post-ironic tattooed venmo authentic bicycle rights chartreuse fanny pack godard gentrify JOMO air plant blackbird spyplane freegan artisan four dollar toast. Deep v franzen humblebrag, taiyaki artisan kogi health goth knausgaard air plant try-hard authentic bespoke.",
            productUrl:"https://slack-imgs.com/?c=1&o1=ro&url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1620188552551-9f98661cbef7%3Fblend%3D000000%26blend-alpha%3D10%26blend-mode%3Dnormal%26blend-w%3D1%26crop%3Dfaces%252Cedges%26h%3D630%26mark%3Dhttps%253A%252F%252Fimages.unsplash.com%252Fopengraph%252Flogo.png%26mark-align%3Dtop%252Cleft%26mark-pad%3D50%26mark-w%3D64%26w%3D1200%26auto%3Dformat%26fit%3Dcrop%26q%3D60%26ixid%3DM3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzA0NTkxMzkzfA%26ixlib%3Drb-4.0.3"
          },
          {
            productId:11,
            productName:"Bosu ball",
            productPrice:65,
            productDescription:"Prism scenester try-hard, locavore humblebrag glossier synth. DSA messenger bag activated charcoal kinfolk thundercats Brooklyn. Messenger bag lomo seitan edison bulb chartreuse tonx. Solarpunk vibecession jianbing taiyaki yr.",
            productUrl:"https://images.unsplash.com/photo-1581122584612-713f89daa8eb?q=80&w=1888&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D”,“createdAt”:“2023-12-19T11:43:40.000Z”,“updatedAt”:“2023-12-19T11:43:40.000Z"
          },
          {
            productId:12,
            productName:"Kettlebell",
            productPrice:80,
            productDescription:"Wayfarers biodiesel pabst keffiyeh retro jean shorts. Sus butcher banh mi, DIY dreamcatcher raw denim church-key hammock. Tumblr migas la croix vaporware lyft af. Freegan viral sus tote bag fixie man bun everyday carry pour-over bodega boys church-key gastropub raclette. Pug chicharrones air plant, vexillologist bespoke tacos selvage etsy. Swag jawn gentrify schlitz salvia twee tattooed glossier keytar typewriter beard hashtag. 8-bit taxidermy kogi before they sold out hashtag, gorpcore meditation.",
            productUrl:"https://images.unsplash.com/photo-1603233720024-bebea0128645?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          },

  ]

  

  constructor(private http: HttpClient) { }

  getAllProducts(): Observable<Product[]> {
    return of(this.sampleProducts);
    // return this.http.get<Product[]>(this.baseURL);
  };

  getProductById(productId: string): Observable<Product | null> {
    // let reqHeaders = {
    //   Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}`
    // }
    // return this.http.get<Product>(`${this.baseURL} /  ${productId}`, {headers: reqHeaders});
    const id = parseInt(productId)
    const product = this.sampleProducts.find(p => p.productId === id)

    return of(product || null)
    };
}
