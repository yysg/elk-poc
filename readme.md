## ELK Stack 使用指南
1. 创建 docker volume 和network

   `docker network create elk`

   `docker volume create --name=elasticsearch`

2. 启动elasticsearch服务

  `docker-compose up elasticsearch`

3. 创建相关服务链接ES的用户

   ```
   docker-compose exec  elasticsearch /bin/bash 
   bin/elasticsearch-setup-passwords interactive #根据提示，依次创建，并记住密码
   ```

4. 创建kibana服务

   `docker-compose up kibana`

   服务启动好之后，就可以访问`http://localhost:5601/`kibana登陆页面，登陆用户使用第3步创建的`elastic/your pass`

5. 为logstash创建传输log的的用户`logstash_internal`，[参考](https://www.elastic.co/guide/en/logstash/current/ls-security.html#ls-http-auth-basic)

   1. Use the the **Management > Roles** UI in Kibana or the `role` API to create a `logstash_writer` role. For **cluster** privileges, add `manage_index_templates` and `monitor`. For **indices** privileges, add `write`, `create`, and `create_index`.

      Add `manage_ilm` for cluster and `manage` and `manage_ilm` for indices if you plan to use [index lifecycle management](https://www.elastic.co/guide/en/elasticsearch/reference/8.5/getting-started-index-lifecycle-management.html).

   2. Create a `logstash_internal` user and assign it the `logstash_writer` role. You can create users from the **Management > Users** UI in Kibana 

   3. 创建好的`logstash_internal`将在`logstash/pipeline/logstash.conf`中使用

      ```
      ...
      ...
      output {
        if [log][file][path] =~"/app/logs/web\d*/.*"{
          elasticsearch {
            hosts => "elasticsearch:9200"
            user => "logstash_internal"
            password => "your_pass"
            index => "web_access_logs-%{+yyyy.MM}.01"
      	  }
        }
      }
      ```

6. 创建logstash服务

   1. logstash有两个配置文件

      `logstash.yml` 为服务本身的配置文件

      `logstash.conf`为处理日志的配置文件，其中`input`定义接受日志的来源，`filter`定义对日志的过滤清洗，`output`定义输出给谁，整体如下

      ```
      input {
      	beats {
      		port => 5044
      	}
      
      	tcp {
      		port => 50000
      	}
      }
      
      ## Add your filters / logstash plugins configuration here
      filter{
        grok {
          match => {"message" => '%{IPV4:ip} - - \[%{TIMESTAMP_ISO8601:timestamp}\] "%{WORD:method} %{DATA:request}" %{NUMBER:status} %{NUMBER:size} "-" "%{DATA:agent}"'}
        }
      }
      output {
        if [log][file][path] =~"/app/logs/web\d*/.*"{
          elasticsearch {
            hosts => "elasticsearch:9200"
            user => "logstash_internal"
            password => "your_pass"
            index => "web_access_logs-%{+yyyy.MM}.01"
      	  }
        }
      }
      ```

      2. `filter`中的`grok`插件，利用的是正则过滤日志，可以通过kibana ui 中的[grok debugger](http://localhost:5601/app/dev_tools#/grokdebugger) 测试
      3. 所有配置完毕后，启动`docker-compose up logstash`

   7. 启动filebeat服务,注意位置好log的路径，详细参看`filebeat/config/filebeat.yml`

      `docker-compose -f docker-compos.filebeat.yml up

   8. 生产测试log，执行`node mocker/web1/index.js`,一切正常的话，[管理界面](http://localhost:5601/app/management/data/index_management/indices)已经可以看到索引了

   ### 至此，一个单节点的ELK stack已经创建好了，有很多功能，慢慢探索吧

   

